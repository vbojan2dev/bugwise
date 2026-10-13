const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Builds an internal URL that respects the site base (needed for GitHub Pages). */
export function href(path: string) {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('#')) return path;
  return base + (path.startsWith('/') ? path : '/' + path);
}

/** Strips the base so the current path can be compared with nav links. */
export function stripBase(pathname: string) {
  const p = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return (p.replace(/\/$/, '') || '/') as string;
}
