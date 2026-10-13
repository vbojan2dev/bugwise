/** Jakob Nielsen's 10 usability heuristics (Nielsen Norman Group), with the official names. */
export const HEURISTICS = [
  { n: 1, name: 'Visibility of system status', short: 'Keep users informed about what is going on, with timely feedback.' },
  { n: 2, name: 'Match between the system and the real world', short: 'Speak the users’ language: familiar words, concepts and order, not internal jargon.' },
  { n: 3, name: 'User control and freedom', short: 'Give a clearly marked way out: back, cancel, undo and redo.' },
  { n: 4, name: 'Consistency and standards', short: 'The same words, styles and actions should mean the same thing, inside the product and across the platform.' },
  { n: 5, name: 'Error prevention', short: 'Prevent problems in the first place, for example with confirmations before destructive actions and good defaults.' },
  { n: 6, name: 'Recognition rather than recall', short: 'Make options and information visible, so users don’t have to remember them.' },
  { n: 7, name: 'Flexibility and efficiency of use', short: 'Shortcuts and personalization speed up frequent users without confusing new ones.' },
  { n: 8, name: 'Aesthetic and minimalist design', short: 'Don’t show information that competes with what matters.' },
  { n: 9, name: 'Help users recognize, diagnose, and recover from errors', short: 'Error messages in plain language that say what went wrong and how to fix it.' },
  { n: 10, name: 'Help and documentation', short: 'When help is needed, make it easy to find, focused on the task and concise.' },
] as const;
