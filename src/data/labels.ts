/** Display labels shared by the glossary and interview pages. */
export const glossaryCategories = {
  process: 'Process',
  types: 'Testing types',
  techniques: 'Techniques',
  bugs: 'Bugs',
  mobile: 'Mobile',
  web: 'Web',
  ui: 'UI',
  tools: 'Tools',
  agile: 'Agile',
} as const;

export const interviewCategories = {
  fundamentals: 'Fundamentals',
  process: 'Process',
  bugs: 'Bugs',
  'test-design': 'Test design',
  mobile: 'Mobile',
  web: 'Web',
  agile: 'Agile',
  practical: 'Practical tasks',
  behavioral: 'Behavioral',
  strategy: 'Strategy and risk',
  leadership: 'Leadership',
} as const;

export const levelLabel = { junior: 'Junior', mid: 'Mid-level', senior: 'Senior' } as const;
export const levelTone = { junior: 'bg-ok-soft text-ok', mid: 'bg-warn-soft text-warn', senior: 'bg-brand-soft text-brand' } as const;
