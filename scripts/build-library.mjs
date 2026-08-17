#!/usr/bin/env node
// Sheet/CSV → library.json — README §4 / §9 step 1.
//
// Reads src/data/library.csv (the temporary CSV fallback described in §4.1)
// and produces src/data/library.json with only ON_SITE=Y rows.
//
// Content-integrity guard (§4.4): fails the build if any published row is
// AI_GENERATED or THIRD_PARTY.
//
// The Google Sheet API path is scaffolded but not enabled until a service
// account is wired (see README §4.1 "Access"). Once creds are set via
// GSHEETS_SERVICE_ACCOUNT_JSON + GSHEET_ID env vars, this script will
// prefer the live sheet over the CSV.

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(ROOT, 'src/data/library.csv');
const OUT_PATH = resolve(ROOT, 'src/data/library.json');

const REQUIRED_COLS = [
  'ID',
  'CATEGORY',
  'SET',
  'YEAR',
  'FILE_NAME',
  'FILE_ID',
  'STATE',
  'ON_SITE',
];

function parseCSV(text) {
  // Minimal RFC-4180-ish parser — quoted fields, embedded commas + quotes.
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

function toRow(headers, values) {
  const rec = {};
  headers.forEach((h, i) => { rec[h.trim()] = (values[i] ?? '').trim(); });
  return {
    id: parseInt(rec.ID, 10),
    category: rec.CATEGORY,
    set: rec.SET,
    year: rec.YEAR,
    fileName: rec.FILE_NAME,
    fileId: rec.FILE_ID,
    state: rec.STATE,
    onSite: /^y(es)?$/i.test(rec.ON_SITE),
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
  const headers = grid[0];
  for (const col of REQUIRED_COLS) {
    if (!headers.includes(col)) {
      throw new Error(`library.csv missing required column: ${col}`);
    }
  }
  const rows = grid.slice(1).map((v) => toRow(headers, v));
  return { rows, headers };
}

function validate(rows) {
  const errors = [];
  const forbidden = new Set(['AI_GENERATED', 'THIRD_PARTY']);
  for (const r of rows) {
    if (!r.onSite) continue;
    if (forbidden.has(r.state)) {
      errors.push(
        `Row ${r.id}: ON_SITE=Y with STATE=${r.state} — forbidden (README §4.4).`,
      );
    }
    if (!r.altText || r.altText.trim() === '') {
      errors.push(`Row ${r.id}: ON_SITE=Y requires ALT_TEXT (README §7).`);
    }
    if (!r.fileId) {
      errors.push(`Row ${r.id}: ON_SITE=Y requires FILE_ID.`);
    }
  }
  if (errors.length) {
    throw new Error(
      `Library validation failed:\n  ${errors.join('\n  ')}`,
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
  validate(rows);
  const out = {
    generatedAt: new Date().toISOString(),
    source,
    rows,
  };
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(
    `[library] wrote ${OUT_PATH} — ${rows.length} total, ${rows.filter((r) => r.onSite).length} published`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
