import { useCallback, useEffect, useRef, useState } from 'react';
import { initialDevice, runCommand, type Device, type TermLine } from './adbEngine';

export type Line = TermLine & { id: number };

/** Holds the simulated device + terminal output. Keeps a ref so quick successive commands never use stale state. */
export function useAdbSession(intro: TermLine[] = []) {
  const devRef = useRef<Device>(initialDevice());
  const [dev, setDevState] = useState<Device>(devRef.current);
  const nextId = useRef(1);
  const withIds = (ls: TermLine[]) => ls.map((l) => ({ ...l, id: nextId.current++ }));
  const [lines, setLines] = useState<Line[]>(() => withIds(intro));
  const [flash, setFlash] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setDev = useCallback((fn: (d: Device) => Device) => {
    devRef.current = fn(devRef.current);
    setDevState(devRef.current);
  }, []);

  const print = useCallback((ls: TermLine[]) => {
    const add = withIds(ls);
    setLines((prev) => [...prev, ...add].slice(-400));
  }, []);

  const run = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (trimmed === 'clear') {
        setLines([]);
        return { dev: devRef.current, out: [] as TermLine[] };
      }
      const before = devRef.current;
      const { dev: next, out } = runCommand(before, trimmed);
      devRef.current = next;
      setDevState(next);
      print([{ kind: 'cmd', text: trimmed }, ...out]);
      if (next.screenshots > before.screenshots) {
        setFlash(true);
        timers.current.push(window.setTimeout(() => setFlash(false), 250));
      }
      if (next.recording && !before.recording) {
        const file = next.recordedFile;
        timers.current.push(
          window.setTimeout(() => {
            devRef.current = { ...devRef.current, recording: false };
            setDevState(devRef.current);
            print([{ kind: 'note', text: `# Recording stopped. ${file} is saved on the phone. Copy it with: adb pull ${file}` }]);
          }, 4000),
        );
      }
      return { dev: next, out };
    },
    [print],
  );

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    devRef.current = initialDevice();
    setDevState(devRef.current);
    setFlash(false);
    setLines(withIds(intro));
    // intro is static per component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { dev, lines, run, setDev, reset, flash };
}
