import { useEffect, useRef, useState } from 'react';
import { loadCapstone, updateCapstone, type CapstoneState } from '@/lib/capstone';

/** Live capstone state; null until mounted (state lives in localStorage, so SSR renders a neutral view). */
export function useCapstone() {
  const [state, setState] = useState<CapstoneState | null>(null);
  useEffect(() => {
    const refresh = () => setState(loadCapstone());
    refresh();
    addEventListener('capstone-change', refresh);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('bugwise:capstone')) refresh();
    };
    addEventListener('storage', onStorage);
    return () => {
      removeEventListener('capstone-change', refresh);
      removeEventListener('storage', onStorage);
    };
  }, []);
  return state;
}

/**
 * A draft stored in state.artifacts[key]. Loads once on mount and saves on every change
 * (the form is the source of truth while the page is open).
 */
export function useArtifact<T extends object>(key: string, init: () => T) {
  const [value, setValue] = useState<T>(init);
  const [loaded, setLoaded] = useState(false);
  const dirty = useRef(false);

  useEffect(() => {
    const saved = loadCapstone().artifacts[key];
    if (saved && typeof saved === 'object') setValue({ ...init(), ...(saved as T) });
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded || !dirty.current) return;
    updateCapstone((s) => {
      s.artifacts[key] = value;
    });
  }, [value, loaded, key]);

  const update = (fn: (prev: T) => T) => {
    dirty.current = true;
    setValue(fn);
  };
  return [value, update, loaded] as const;
}

export function fmtDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}
