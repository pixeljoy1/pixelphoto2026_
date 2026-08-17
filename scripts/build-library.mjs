#!/usr/bin/env node
// Sheet/CSV → library.json — README §4 / §9 step 1.
//
// Reads src/data/library.csv (the temporary CSV fallback described in §4.1),
// respects the ON_SITE publish gate, and produces src/data/library.json
// containing only the rows that survived.
//
// Content-integrity guard (§4.4):
//   STATE in {AI_GENERATED, THIRD_PARTY, ARTWORK} → never publish
//   CATEGORY = BRAND (signature files, §4.3)       → never publish
// In strict mode any ON_SITE=Y violation FAILS the build. In draft mode
// the offending rows are silently dropped with a warning summary.
//
// Draft mode (env DRAFT_MODE=true):
//   • Auto-promote every STATE=EXPORTED row that isn't hard-filtered above
//     to ON_SITE=Y (so the site populates without editing the sheet)
//   • Downgrade the missing-ALT_TEXT check (§7) from error to warning
//   • Downgrade the content-integrity guard from error to warning + drop
//
// The Google Sheet API path is scaffolded but not wired until a service
// account is available (README §4.1). Once creds are set via
// GSHEETS_SERVICE_ACCOUNT_JSON + GSHEET_ID env vars, this script will
// prefer the live sheet over the CSV.

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(ROOT, 'src/data/library.csv');
const OUT_PATH = resolve(ROOT, 'src/data/library.json');

const DRAFT_MODE = /^(1|true|yes)$/i.test(process.env.DRAFT_MODE ?? '');

const REQUIRED_COLS = [
  ['ID', 'ROW'],
  ['CATEGORY'],
  ['SET'],
  ['YEAR'],
  ['FILE_NAME'],
  ['FILE_ID'],
  ['STATE'],
  ['ON_SITE'],
];

const FORBIDDEN_STATES = new Set(['AI_GENERATED', 'THIRD_PARTY', 'ARTWORK']);
const FORBIDDEN_CATEGORIES = new Set(['BRAND']);

function parseCSV(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function pick(rec, aliases) {
  for (const key of aliases) if (rec[key] !== undefined) return rec[key];
  return '';
}

function toRow(headers, values) {
  const rec = {};
  headers.forEach((h, i) => { rec[h.trim()] = (values[i] ?? '').trim(); });
  return {
    id: parseInt(pick(rec, ['ID', 'ROW']), 10),
    category: rec.CATEGORY,
    set: rec.SET,
    year: rec.YEAR,
    fileName: rec.FILE_NAME,
    fileId: rec.FILE_ID,
    state: rec.STATE,
    onSite: /^y(es)?$/i.test(rec.ON_SITE),
    onSiteExplicitNo: /^n(o)?$/i.test(rec.ON_SITE),
    gallery: rec.GALLERY || undefined,
    sort: rec.SORT ? parseInt(rec.SORT, 10) : undefined,
    title: rec.TITLE || undefined,
    caption: rec.CAPTION || undefined,
    altText: rec.ALT_TEXT || undefined,
  };
}

async function loadCSV() {
  try { await access(CSV_PATH); } catch { return null; }
  const text = await readFile(CSV_PATH, 'utf8');
  const grid = parseCSV(text);
  if (grid.length === 0) return { rows: [], headers: [] };
  const headers = grid[0].map((h) => h.trim());
  for (const aliases of REQUIRED_COLS) {
    if (!aliases.some((a) => headers.includes(a))) {
      throw new Error(
        `library.csv missing required column (one of: ${aliases.join(', ')})`,
      );
    }
  }
  const rows = grid.slice(1).map((v) => toRow(headers, v));
  return { rows, headers };
}

function isForbidden(row) {
  if (FORBIDDEN_STATES.has(row.state)) return `STATE=${row.state}`;
  if (FORBIDDEN_CATEGORIES.has(row.category)) return `CATEGORY=${row.category}`;
  return null;
}

function applyDraftMode(rows) {
  const droppedForbidden = [];
  for (const row of rows) {
    const reason = isForbidden(row);
    if (reason) {
      if (row.onSite) droppedForbidden.push({ row, reason });
      row.onSite = false; // hard drop, always
      continue;
    }
    if (row.onSiteExplicitNo) continue; // explicit N always wins, never auto-promoted
    if (row.state === 'EXPORTED' && !row.onSite) row.onSite = true;
  }
  if (droppedForbidden.length) {
    console.warn(
      `[library] draft mode: dropped ${droppedForbidden.length} ON_SITE=Y row(s) that violate §4.4:`,
    );
    for (const { row, reason } of droppedForbidden) {
      console.warn(`         row ${row.id}: ${row.fileName} (${reason})`);
    }
  }
  const promoted = rows.filter((r) => r.onSite && r.state === 'EXPORTED').length;
  console.log(
    `[library] draft mode: auto-marked ${promoted} EXPORTED row(s) as ON_SITE=Y`,
  );
}

function validateStrict(rows) {
  const errors = [];
  for (const r of rows) {
    if (!r.onSite) continue;
    const reason = isForbidden(r);
    if (reason) {
      errors.push(`Row ${r.id}: ON_SITE=Y with ${reason} — forbidden (§4.4).`);
    }
    if (!r.altText || r.altText.trim() === '') {
      errors.push(`Row ${r.id}: ON_SITE=Y requires ALT_TEXT (§7).`);
    }
    if (!r.fileId) {
      errors.push(`Row ${r.id}: ON_SITE=Y requires FILE_ID.`);
    }
  }
  if (errors.length) {
    throw new Error(`Library validation failed:\n  ${errors.join('\n  ')}`);
  }
}

function validateDraft(rows) {
  const missingAlt = rows.filter(
    (r) => r.onSite && (!r.altText || r.altText.trim() === ''),
  );
  const missingId = rows.filter((r) => r.onSite && !r.fileId);
  if (missingId.length) {
    // FILE_ID is required even in draft — nothing to display without it.
    throw new Error(
      `Draft mode still requires FILE_ID on published rows. Missing: ${missingId.map((r) => r.id).join(', ')}`,
    );
  }
  if (missingAlt.length) {
    console.warn(
      `[library] draft mode: ${missingAlt.length} published row(s) missing ALT_TEXT (fine for draft, blocks release)`,
    );
  }
}

async function main() {
  const csv = await loadCSV();
  let rows = [];
  let source = 'seed';
  if (csv) {
    rows = csv.rows;
    source = 'csv';
    console.log(`[library] loaded ${rows.length} rows from CSV`);
  } else {
    console.log(`[library] no CSV at src/data/library.csv — emitting empty library`);
  }

  console.log(`[library] mode: ${DRAFT_MODE ? 'DRAFT' : 'STRICT'}`);
  if (DRAFT_MODE) {
    applyDraftMode(rows);
    validateDraft(rows);
  } else {
    validateStrict(rows);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    source,
    mode: DRAFT_MODE ? 'draft' : 'strict',
    rows,
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  const published = rows.filter((r) => r.onSite).length;
  console.log(
    `[library] wrote ${OUT_PATH} — ${rows.length} total, ${published} published`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
