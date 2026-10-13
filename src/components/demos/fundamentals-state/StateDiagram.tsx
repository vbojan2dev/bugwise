import { useId } from 'react';
import { allModels, tkey, type Model, type TransitionDef } from './models';

/*
 * Accessible SVG state diagram drawn from a model. Uses the site's color tokens,
 * so it works in light and dark mode. The viewBox is ~380px wide so labels stay
 * readable when it scales down on a phone.
 *
 * Static use (no client directive needed): <StateDiagram modelId="music" />
 */

interface Props {
  model?: Model;
  modelId?: string;
  current?: string;
  visited?: ReadonlySet<string>;
  covered?: ReadonlySet<string>;
  last?: string | null;
  /** Show uncovered transitions as dashed lines. */
  coverage?: boolean;
  caption?: string;
  className?: string;
}

const H = 34;

function edgeLabel(t: TransitionDef, model: Model) {
  if (t.diagramLabel) return t.diagramLabel;
  const ev = model.events.find((e) => e.id === t.event)?.label.toLowerCase() ?? t.event;
  return t.guard ? `${ev} [${t.guard}]` : ev;
}

/** Point where a ray from the center of a box in direction (dx, dy) leaves the box. */
function exit(cx: number, cy: number, hw: number, hh: number, dx: number, dy: number, gap = 3) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const t = Math.min(ux ? (hw + gap) / Math.abs(ux) : Infinity, uy ? (hh + gap) / Math.abs(uy) : Infinity);
  return { x: cx + ux * t, y: cy + uy * t };
}

export function describeModel(model: Model) {
  const name = (id: string) => model.states.find((s) => s.id === id)?.label ?? id;
  const ev = (id: string) => model.events.find((e) => e.id === id)?.label ?? id;
  const start = model.states.find((s) => s.initial);
  const finals = model.states.filter((s) => s.final).map((s) => s.label);
  const parts = model.transitions.map(
    (t) => `${name(t.from)} to ${name(t.to)} on ${ev(t.event)}${t.guard ? ` if ${t.guard}` : ''}${t.action ? ` (${t.action})` : ''}`,
  );
  return `State diagram of ${model.name.toLowerCase()}. ${model.states.length} states: ${model.states.map((s) => s.label).join(', ')}. Starts in ${start?.label}.${
    finals.length ? ` Final states: ${finals.join(', ')}.` : ''
  } Transitions: ${parts.join('; ')}.`;
}

export default function StateDiagram({ model: m, modelId, current, visited, covered, last, coverage = false, caption, className = '' }: Props) {
  const model = m ?? allModels[modelId ?? 'order'];
  const uid = useId().replace(/:/g, '');
  const W = model.nodeWidth ?? 86;
  const pos = Object.fromEntries(model.states.map((s) => [s.id, s]));

  const edgeColor = (k: string) => {
    if (last === k) return 'var(--brand)';
    if (coverage) return covered?.has(k) ? 'var(--ok)' : 'var(--faint)';
    return 'var(--muted)';
  };
  const marker = (k: string) => (last === k ? 'last' : coverage ? (covered?.has(k) ? 'ok' : 'off') : 'base');

  const edges = model.transitions.map((t) => {
    const k = tkey(t.from, t.event);
    const a = pos[t.from];
    const b = pos[t.to];
    let d: string;
    let lx: number;
    let ly: number;
    if (t.from === t.to) {
      // Self-loop above the node.
      const top = a.y - H / 2;
      d = `M ${a.x - 14} ${top - 2} C ${a.x - 34} ${top - 40}, ${a.x + 34} ${top - 40}, ${a.x + 14} ${top - 3}`;
      lx = a.x;
      ly = top - 36;
    } else {
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const bend = t.bend ?? 0;
      const cx = mx + (-dy / len) * bend;
      const cy = my + (dx / len) * bend;
      const s = exit(a.x, a.y, W / 2, H / 2, cx - a.x, cy - a.y, 2);
      const e = exit(b.x, b.y, W / 2, H / 2, cx - b.x, cy - b.y, 4);
      d = bend ? `M ${s.x} ${s.y} Q ${cx} ${cy} ${e.x} ${e.y}` : `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
      // Label at the curve's midpoint, pushed a little further out on the bent side.
      const push = bend ? Math.sign(bend) * 9 : 0;
      lx = 0.25 * s.x + 0.5 * cx + 0.25 * e.x + (-dy / len) * push;
      ly = 0.25 * s.y + 0.5 * cy + 0.25 * e.y + (dx / len) * push;
    }
    return { t, k, d, lx: lx + (t.labelDx ?? 0), ly: ly + (t.labelDy ?? 0) + 4, label: edgeLabel(t, model) };
  });

  const markers: [string, string][] = [
    ['base', 'var(--muted)'],
    ['ok', 'var(--ok)'],
    ['off', 'var(--faint)'],
    ['last', 'var(--brand)'],
  ];

  return (
    <figure className={`not-prose m-0 ${className}`}>
      <svg viewBox={`0 0 ${model.width} ${model.height}`} role="img" aria-label={describeModel(model)} className="mx-auto block h-auto w-full max-w-[460px] select-none">
        <defs>
          {markers.map(([id, c]) => (
            <marker key={id} id={`${uid}-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* Edges */}
        {edges.map(({ k, d }) => (
          <path
            key={k}
            d={d}
            fill="none"
            stroke={edgeColor(k)}
            strokeWidth={last === k ? 2.6 : 1.6}
            strokeDasharray={coverage && !covered?.has(k) && last !== k ? '4 4' : undefined}
            markerEnd={`url(#${uid}-${marker(k)})`}
            style={{ transition: 'stroke .2s' }}
          />
        ))}

        {/* Initial-state arrows */}
        {model.states
          .filter((s) => s.initial)
          .map((s) => {
            const fromTop = s.initialFrom === 'top';
            const x1 = fromTop ? s.x : s.x - W / 2 - 22;
            const y1 = fromTop ? s.y - H / 2 - 22 : s.y;
            const x2 = fromTop ? s.x : s.x - W / 2 - 3;
            const y2 = fromTop ? s.y - H / 2 - 3 : s.y;
            return (
              <g key={`init-${s.id}`} aria-hidden="true">
                <circle cx={x1} cy={y1} r={4} fill="var(--fg)" />
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--fg)" strokeWidth={1.6} markerEnd={`url(#${uid}-base)`} />
              </g>
            );
          })}

        {/* Edge labels (drawn after edges so they sit on top) */}
        {edges.map(({ k, lx, ly, label }) => (
          <text
            key={`l-${k}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize={11.5}
            fontWeight={last === k ? 700 : 500}
            fill={last === k ? 'var(--brand)' : 'var(--fg)'}
            stroke="var(--surface)"
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {label}
          </text>
        ))}

        {/* Nodes */}
        {model.states.map((s) => {
          const isCur = current === s.id;
          const seen = visited?.has(s.id);
          return (
            <g key={s.id}>
              {s.final && (
                <rect x={s.x - W / 2 - 3} y={s.y - H / 2 - 3} width={W + 6} height={H + 6} rx={12} fill="none" stroke={isCur ? 'var(--brand)' : 'var(--line-strong)'} strokeWidth={1.4} />
              )}
              <rect
                x={s.x - W / 2}
                y={s.y - H / 2}
                width={W}
                height={H}
                rx={9}
                fill={isCur ? 'var(--brand)' : seen ? 'var(--brand-soft)' : 'var(--surface)'}
                stroke={isCur || seen ? 'var(--brand)' : 'var(--line-strong)'}
                strokeWidth={isCur ? 2.4 : 1.4}
                style={{ transition: 'fill .2s, stroke .2s' }}
              />
              <text x={s.x} y={s.y + 4.2} textAnchor="middle" fontSize={12} fontWeight={600} fill={isCur ? 'var(--brand-fg)' : 'var(--fg)'}>
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption className="mt-2 text-center text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
