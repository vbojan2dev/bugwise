// Minimal typing for the sql.js package (it ships without TypeScript types).
// The API surface we use is typed in engine.ts.
declare module 'sql.js' {
  const initSqlJs: (config?: { locateFile?: (file: string) => string }) => Promise<unknown>;
  export default initSqlJs;
}
