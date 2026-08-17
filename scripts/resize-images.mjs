#!/usr/bin/env node
// One-off: resize decoded Drive originals in /tmp/originals into
// public/photos/<discipline>/<fileId>-{thumb,full}.jpg
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = process.argv[2] ? path.resolve(process.argv[2]) : '/tmp/originals';
const DISCIPLINE = process.argv[3] || 'wildlife';
const OUT_DIR = path.resolve(`public/photos/${DISCIPLINE}`);
const MANIFEST_PATH = path.resolve('src/data/photo-assets.json');

const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) : {};

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.bin'));

for (const f of files) {
  const fileId = f.replace(/\.bin$/, '');
  const src = path.join(SRC_DIR, f);
  const thumbOut = path.join(OUT_DIR, `${fileId}-thumb.jpg`);
  const fullOut = path.join(OUT_DIR, `${fileId}-full.jpg`);

  await sharp(src).rotate().resize({ width: 640 }).jpeg({ quality: 78 }).toFile(thumbOut);
  await sharp(src).rotate().resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 84 }).toFile(fullOut);

  manifest[fileId] = {
    thumb: `/photos/${DISCIPLINE}/${fileId}-thumb.jpg`,
    full: `/photos/${DISCIPLINE}/${fileId}-full.jpg`,
  };
  console.log(`done ${fileId}`);
}

writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest updated: ${MANIFEST_PATH} (${Object.keys(manifest).length} entries)`);
