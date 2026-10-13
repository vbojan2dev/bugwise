export type LevelId = 'unit' | 'integration' | 'system' | 'acceptance';

export const levelLabels: Record<LevelId, string> = {
  unit: 'Unit',
  integration: 'Integration',
  system: 'System',
  acceptance: 'Acceptance',
};

export const levelOrder: LevelId[] = ['unit', 'integration', 'system', 'acceptance'];
