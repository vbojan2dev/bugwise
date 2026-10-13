import type { Opt } from './Dropdown';

const o = (labels: string[]): Opt[] => labels.map((l) => ({ value: l, label: l }));

/** English country names with accents, for the searchable combobox. Sorted A–Z. */
export const countries: Opt[] = o([
  'Albania',
  'Andorra',
  'Austria',
  'Belgium',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Côte d’Ivoire',
  'Croatia',
  'Curaçao',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Montenegro',
  'Netherlands',
  'North Macedonia',
  'Norway',
  'Poland',
  'Portugal',
  'Réunion',
  'Romania',
  'São Tomé and Príncipe',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Türkiye',
  'United Kingdom',
]);

export const citiesByCountry: Record<string, string[]> = {
  Croatia: ['Osijek', 'Rijeka', 'Split', 'Šibenik', 'Zadar', 'Zagreb'],
  Serbia: ['Beograd', 'Kragujevac', 'Niš', 'Novi Sad', 'Subotica'],
  Slovenia: ['Celje', 'Koper', 'Kranj', 'Ljubljana', 'Maribor'],
};

export { o as toOptions };
