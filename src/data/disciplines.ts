// Public-facing discipline taxonomy — see README §4.3.
// The DB uses CULTURAL/DOCUMENTARY and SUBMISSIONS; the site displays them
// as DOCUMENTARY and AWARDS. MACRO_OTHER is a placeholder pending §11 Q2.

export type DisciplineKey =
  | 'wildlife'
  | 'astro'
  | 'aviation'
  | 'landscape'
  | 'street'
  | 'documentary'
  | 'portrait'
  | 'macro'
  | 'awards';

export interface Discipline {
  key: DisciplineKey;
  label: string;
  dbCategory: string;
  blurb: string;
}

export const DISCIPLINES: Discipline[] = [
  {
    key: 'wildlife',
    label: 'Wildlife',
    dbCategory: 'WILDLIFE',
    blurb: 'Big cats, birds, and the long wait between frames.',
  },
  {
    key: 'astro',
    label: 'Astrophotography',
    dbCategory: 'ASTRO',
    blurb: 'Deep-sky and wide-field, stacked and calibrated.',
  },
  {
    key: 'aviation',
    label: 'Aviation',
    dbCategory: 'AVIATION',
    blurb: 'Air shows and hard-panned climbs.',
  },
  {
    key: 'landscape',
    label: 'Landscape',
    dbCategory: 'LANDSCAPE',
    blurb: 'Weather, terrain, and the hour before the light works.',
  },
  {
    key: 'street',
    label: 'Street',
    dbCategory: 'STREET_URBAN',
    blurb: 'Cities as they run past the lens.',
  },
  {
    key: 'documentary',
    label: 'Documentary',
    dbCategory: 'CULTURAL',
    blurb: 'Bodies of work — Varanasi, Kumbh, and the ghats.',
  },
  {
    key: 'portrait',
    label: 'Portrait',
    dbCategory: 'PORTRAIT',
    blurb: 'People, in and out of context.',
  },
  {
    key: 'macro',
    label: 'Macro',
    dbCategory: 'MACRO_OTHER',
    blurb: 'Small-scale work — pending taxonomy review (README §11 Q2).',
  },
  {
    key: 'awards',
    label: 'Awards',
    dbCategory: 'SUBMISSIONS',
    blurb: 'Competition submissions and finalist entries.',
  },
];
