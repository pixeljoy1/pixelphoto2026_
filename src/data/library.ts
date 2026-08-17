import raw from './library.json';
import { DISCIPLINES, type Discipline, type DisciplineKey } from './disciplines';

export type LibraryState =
  | 'EXPORTED'
  | 'UNCURATED'
  | 'NEEDS_EXPORT'
  | 'WORKING'
  | 'ARTWORK'
  | 'AI_GENERATED'
  | 'THIRD_PARTY';

export interface LibraryRow {
  id: number;
  category: string;
  set: string;
  year: string;
  fileName: string;
  fileId: string;
  state: LibraryState;
  onSite: boolean;
  gallery?: string;
  sort?: number;
  title?: string;
  caption?: string;
  altText?: string;
}

interface LibraryFile {
  generatedAt: string | null;
  source: string;
  mode?: 'draft' | 'strict';
  rows: LibraryRow[];
}

const library = raw as LibraryFile;

// Content integrity (§4.4) is enforced upstream in scripts/build-library.mjs.
// By the time we read library.json, forbidden rows have already been dropped
// (draft mode) or the build has already failed (strict mode).

export const rows: LibraryRow[] = library.rows.filter((r) => r.onSite);

export interface DisciplineSummary {
  discipline: Discipline;
  frameCount: number;
  yearFrom?: number;
  yearTo?: number;
  sets: SetSummary[];
}

export interface SetSummary {
  slug: string;
  name: string;
  frameCount: number;
  year?: string;
  rows: LibraryRow[];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function summarize(): DisciplineSummary[] {
  return DISCIPLINES.map((discipline) => {
    const disciplineRows = rows.filter(
      (r) => r.category === discipline.dbCategory || r.gallery === discipline.key,
    );
    const years = disciplineRows
      .map((r) => parseInt(r.year, 10))
      .filter((y) => Number.isFinite(y));
    const bySet = new Map<string, LibraryRow[]>();
    for (const row of disciplineRows) {
      const key = row.set || 'Uncatalogued';
      if (!bySet.has(key)) bySet.set(key, []);
      bySet.get(key)!.push(row);
    }
    const sets: SetSummary[] = [...bySet.entries()]
      .map(([name, rs]) => ({
        slug: slugify(name),
        name,
        frameCount: rs.length,
        year: rs[0]?.year,
        rows: rs.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      discipline,
      frameCount: disciplineRows.length,
      yearFrom: years.length ? Math.min(...years) : undefined,
      yearTo: years.length ? Math.max(...years) : undefined,
      sets,
    };
  });
}

export function getDiscipline(key: DisciplineKey): DisciplineSummary | undefined {
  return summarize().find((d) => d.discipline.key === key);
}

export function getSet(key: DisciplineKey, slug: string): SetSummary | undefined {
  return getDiscipline(key)?.sets.find((s) => s.slug === slug);
}

export const totals = {
  frames: rows.length,
  disciplines: DISCIPLINES.length,
  generatedAt: library.generatedAt,
  source: library.source,
};
