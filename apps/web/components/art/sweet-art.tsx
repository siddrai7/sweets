import { useId } from 'react';
import type { ArtSpec, ArtTone } from '@/lib/art';

/**
 * Hand-drawn style SVG still life of a sweet on a plate or in a bowl. Stands in for product
 * photography: crisp at any size, zero bytes over the network, and specific enough to the
 * product (ladoo, katli, rasgulla…) that the catalogue still reads at a glance.
 */
export function SweetArt({
  spec,
  background = true,
  fit = 'slice',
  className = '',
}: {
  spec: ArtSpec;
  background?: boolean;
  /** `meet` keeps the whole still life visible in tall or wide frames. */
  fit?: 'slice' | 'meet';
  className?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { kind, tone, garnish = 'none' } = spec;
  const ids = {
    bg: `${uid}bg`,
    ball: `${uid}ball`,
    top: `${uid}top`,
    side: `${uid}side`,
    tex: `${uid}tex`,
    strands: `${uid}str`,
    bowl: `${uid}bowl`,
    plate: `${uid}plate`,
  };
  const url = (id: string) => `url(#${id})`;
  const inBowl = ['balls', 'rasmalai', 'halwa', 'namkeen', 'mix'].includes(kind);
  const brass = kind === 'namkeen' || kind === 'mix' || kind === 'halwa';

  return (
    <svg
      viewBox="12 24 176 176"
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id={ids.bg} cx="50%" cy="38%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="100%" stopColor={tone.bg} />
        </radialGradient>
        <radialGradient id={ids.ball} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor={tone.light} />
          <stop offset="55%" stopColor={tone.body} />
          <stop offset="100%" stopColor={tone.dark} />
        </radialGradient>
        <linearGradient id={ids.top} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone.light} />
          <stop offset="100%" stopColor={tone.body} />
        </linearGradient>
        <linearGradient id={ids.side} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.body} />
          <stop offset="100%" stopColor={tone.dark} />
        </linearGradient>
        <pattern id={ids.tex} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.25" fill={tone.dark} fillOpacity="0.28" />
          <circle cx="4" cy="3.8" r="0.9" fill={tone.light} fillOpacity="0.5" />
        </pattern>
        <pattern id={ids.strands} width="9" height="7" patternUnits="userSpaceOnUse">
          <path
            d="M0.5 2.5l5 1.5M4 6l4.5-2M6.5 1l2 0.6"
            stroke={tone.dark}
            strokeOpacity="0.55"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path d="M1.5 5.5l3-1" stroke={tone.light} strokeWidth="1" strokeLinecap="round" />
        </pattern>
        <linearGradient id={ids.bowl} x1="0" y1="0" x2="0" y2="1">
          {brass ? (
            <>
              <stop offset="0%" stopColor="#ecc978" />
              <stop offset="55%" stopColor="#c4943a" />
              <stop offset="100%" stopColor="#8f6420" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e6ddcf" />
            </>
          )}
        </linearGradient>
        <radialGradient id={ids.plate} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#efe7da" />
        </radialGradient>
      </defs>

      {background && (
        <>
          <rect x="12" y="24" width="176" height="176" fill={url(ids.bg)} />
          <circle
            cx="100"
            cy="112"
            r="92"
            fill="none"
            stroke={tone.dark}
            strokeOpacity="0.07"
            strokeDasharray="1 5"
            strokeLinecap="round"
          />
        </>
      )}

      {inBowl ? (
        <Bowl kind={kind} tone={tone} garnish={garnish} url={url} ids={ids} brass={brass} />
      ) : (
        <>
          {/* Plate */}
          <ellipse cx="100" cy="162" rx="84" ry="14" fill="#2d0a10" fillOpacity="0.08" />
          <ellipse cx="100" cy="134" rx="84" ry="28" fill="#e9dfcf" />
          <ellipse cx="100" cy="131" rx="84" ry="28" fill={url(ids.plate)} />
          <ellipse
            cx="100"
            cy="131"
            rx="80.5"
            ry="25.5"
            fill="none"
            stroke="#d9ae5b"
            strokeWidth="1.2"
          />
          <ellipse cx="100" cy="133" rx="62" ry="18" fill="#000" fillOpacity="0.025" />
          <PlateItems kind={kind} tone={tone} garnish={garnish} url={url} ids={ids} />
        </>
      )}
    </svg>
  );
}

type Ids = Record<'ball' | 'top' | 'side' | 'tex' | 'strands' | 'bowl' | 'plate', string>;
interface PartProps {
  kind: ArtSpec['kind'];
  tone: ArtTone;
  garnish: NonNullable<ArtSpec['garnish']>;
  url: (id: string) => string;
  ids: Ids;
}

function Sphere({
  x,
  y,
  r,
  url,
  ids,
  textured,
  tone,
}: {
  x: number;
  y: number;
  r: number;
  url: PartProps['url'];
  ids: Ids;
  textured?: boolean;
  tone: ArtTone;
}) {
  return (
    <g>
      <ellipse
        cx={x}
        cy={y + r * 0.82}
        rx={r * 0.9}
        ry={r * 0.26}
        fill={tone.dark}
        fillOpacity="0.22"
      />
      <circle cx={x} cy={y} r={r} fill={url(ids.ball)} />
      {textured && <circle cx={x} cy={y} r={r} fill={url(ids.tex)} />}
      <ellipse
        cx={x - r * 0.35}
        cy={y - r * 0.42}
        rx={r * 0.28}
        ry={r * 0.16}
        fill="#fff"
        fillOpacity="0.45"
        transform={`rotate(-25 ${x - r * 0.35} ${y - r * 0.42})`}
      />
    </g>
  );
}

/** A flat-topped piece seen from above at an angle: top face + front edge. */
function Slab({
  x,
  y,
  w,
  d,
  h,
  r = 3,
  url,
  ids,
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  r?: number;
  url: PartProps['url'];
  ids: Ids;
}) {
  return (
    <g>
      <rect x={x} y={y + d - r} width={w} height={h + r} rx={r} fill={url(ids.side)} />
      <rect x={x} y={y} width={w} height={d} rx={r} fill={url(ids.top)} />
    </g>
  );
}

function Disc({
  x,
  y,
  rx,
  ry,
  h,
  url,
  ids,
  tone,
}: {
  x: number;
  y: number;
  rx: number;
  ry: number;
  h: number;
  url: PartProps['url'];
  ids: Ids;
  tone: ArtTone;
}) {
  return (
    <g>
      <ellipse
        cx={x}
        cy={y + h + 3}
        rx={rx * 0.95}
        ry={ry * 0.7}
        fill={tone.dark}
        fillOpacity="0.18"
      />
      <ellipse cx={x} cy={y + h} rx={rx} ry={ry} fill={tone.dark} />
      <rect x={x - rx} y={y} width={rx * 2} height={h} fill={url(ids.side)} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={url(ids.top)} />
    </g>
  );
}

function Silver({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g fill="#fff">
      <path
        d={`M${x - 9 * s} ${y}l${6 * s} ${-3 * s}l${8 * s} ${1 * s}l${4 * s} ${3 * s}l${-7 * s} ${3 * s}z`}
        fillOpacity="0.55"
      />
      <circle cx={x + 7 * s} cy={y - 3 * s} r={0.9 * s} fillOpacity="0.8" />
      <circle cx={x - 5 * s} cy={y + 3 * s} r={0.7 * s} fillOpacity="0.8" />
    </g>
  );
}

function Pista({ x, y, a = 0 }: { x: number; y: number; a?: number }) {
  return (
    <g transform={`rotate(${a} ${x} ${y})`}>
      <ellipse cx={x} cy={y} rx="3.4" ry="1.3" fill="#7fa04a" />
      <ellipse cx={x - 0.6} cy={y - 0.3} rx="1.8" ry="0.6" fill="#c4d98f" />
    </g>
  );
}

function Nut({ x, y, a = 0 }: { x: number; y: number; a?: number }) {
  return (
    <ellipse
      cx={x}
      cy={y}
      rx="3"
      ry="1.6"
      fill="#f3dfb8"
      stroke="#b88a52"
      strokeWidth="0.5"
      transform={`rotate(${a} ${x} ${y})`}
    />
  );
}

function PlateItems({ kind, tone, garnish, url, ids }: PartProps) {
  switch (kind) {
    case 'ladoo': {
      const r = 21;
      const balls = [
        [100, 66],
        [80, 94],
        [120, 94],
        [60, 120],
        [100, 123],
        [140, 120],
      ] as const;
      return (
        <g>
          {balls.map(([x, y]) => (
            <Sphere key={`${x}-${y}`} x={x} y={y} r={r} url={url} ids={ids} tone={tone} textured />
          ))}
          {garnish === 'nuts' &&
            balls.map(([x, y], i) => <Nut key={i} x={x + 4} y={y - 10} a={i * 40} />)}
          {garnish === 'seeds' &&
            balls.map(([x, y], i) => (
              <ellipse key={i} cx={x + 5} cy={y - 12} rx="1.6" ry="2.6" fill="#fff8e6" />
            ))}
        </g>
      );
    }
    case 'katli': {
      const pts: [number, number][] = [
        [100, 92],
        [76, 102],
        [124, 102],
        [52, 112],
        [100, 112],
        [148, 112],
        [76, 122],
        [124, 122],
        [100, 132],
      ];
      const w = 23;
      const h = 9.5;
      const t = 4;
      return (
        <g>
          {pts.map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <path
                d={`M${x - w} ${y}L${x} ${y + h}L${x + w} ${y}L${x + w} ${y + t}L${x} ${y + h + t}L${x - w} ${y + t}Z`}
                fill={tone.dark}
              />
              <path
                d={`M${x} ${y - h}L${x + w} ${y}L${x} ${y + h}L${x - w} ${y}Z`}
                fill={url(ids.top)}
              />
              {garnish === 'silver' && (
                <path
                  d={`M${x} ${y - h + 3}L${x + w - 7} ${y}L${x} ${y + h - 3}L${x - w + 7} ${y}Z`}
                  fill="#fff"
                  fillOpacity="0.32"
                />
              )}
            </g>
          ))}
          {garnish === 'silver' && <Silver x={100} y={112} s={1.1} />}
        </g>
      );
    }
    case 'barfi':
    case 'dhokla': {
      const w = 34;
      const d = 16;
      const h = kind === 'dhokla' ? 16 : 11;
      const cols = [45, 83, 121];
      const rows = [84, 108];
      return (
        <g>
          {rows.map((y) =>
            cols.map((x, i) => (
              <g key={`${x}-${y}`}>
                <Slab x={x} y={y} w={w} d={d} h={h} url={url} ids={ids} />
                {kind === 'barfi' && garnish === 'none' && (
                  <rect x={x} y={y} width={w} height={d} rx="3" fill={url(ids.tex)} />
                )}
                {garnish === 'pista' && (
                  <>
                    <Pista x={x + 11} y={y + 6} a={-20 + i * 15} />
                    <Pista x={x + 22} y={y + 10} a={30 - i * 10} />
                  </>
                )}
                {kind === 'dhokla' && (
                  <g fill="#3b2a1a">
                    <circle cx={x + 8} cy={y + 5} r="1" />
                    <circle cx={x + 18} cy={y + 9} r="1" />
                    <circle cx={x + 26} cy={y + 4} r="1" />
                    <path
                      d={`M${x + 10} ${y + 11}q4 -3 9 -1`}
                      stroke="#4f7c3a"
                      strokeWidth="1.6"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            )),
          )}
        </g>
      );
    }
    case 'pedha':
    case 'cookies':
    case 'roll': {
      const flat = kind === 'cookies';
      const pts: [number, number][] = [
        [62, 98],
        [100, 92],
        [138, 98],
        [80, 116],
        [120, 116],
        [100, 136],
      ];
      return (
        <g>
          {pts.map(([x, y], i) => (
            <g key={`${x}-${y}`}>
              <Disc
                x={x}
                y={y}
                rx={kind === 'roll' ? 18 : 21}
                ry={kind === 'roll' ? 9 : 8.5}
                h={flat ? 4 : 7}
                url={url}
                ids={ids}
                tone={tone}
              />
              {kind === 'pedha' && (
                <>
                  <ellipse cx={x} cy={y} rx="7" ry="2.6" fill={tone.dark} fillOpacity="0.35" />
                  <Pista x={x} y={y - 0.5} a={i * 30} />
                </>
              )}
              {kind === 'cookies' && (
                <>
                  <ellipse
                    cx={x}
                    cy={y}
                    rx="14"
                    ry="5.5"
                    fill="none"
                    stroke={tone.dark}
                    strokeOpacity="0.35"
                  />
                  <ellipse
                    cx={x}
                    cy={y}
                    rx="7"
                    ry="2.8"
                    fill="none"
                    stroke={tone.dark}
                    strokeOpacity="0.3"
                  />
                </>
              )}
              {kind === 'roll' && (
                <path
                  d={`M${x} ${y}m-2 0a2 1 0 1 1 4 0a5 2.4 0 1 1 -9 0a9 4.4 0 1 1 17 0a13 6 0 1 1 -24 0`}
                  fill="none"
                  stroke={tone.light}
                  strokeWidth="1.3"
                />
              )}
            </g>
          ))}
        </g>
      );
    }
    case 'kachori': {
      const pts: [number, number][] = [
        [100, 92],
        [66, 108],
        [134, 108],
        [100, 124],
      ];
      return (
        <g>
          {pts.map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <ellipse cx={x} cy={y + 14} rx="26" ry="7" fill={tone.dark} fillOpacity="0.2" />
              <ellipse cx={x} cy={y} rx="27" ry="17" fill={url(ids.ball)} />
              <path
                d={`M${x - 10} ${y - 4}q6 3 9 -2q3 5 9 1`}
                fill="none"
                stroke={tone.dark}
                strokeOpacity="0.55"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <ellipse cx={x - 9} cy={y - 8} rx="7" ry="3" fill="#fff" fillOpacity="0.3" />
            </g>
          ))}
        </g>
      );
    }
    case 'biscotti': {
      return (
        <g>
          {[52, 74, 96, 118, 140].map((x, i) => (
            <g key={x} transform={`rotate(${-18 + i * 2} ${x + 9} 110)`}>
              <rect x={x} y={78 + (i % 2) * 6} width="18" height="56" rx="7" fill={tone.dark} />
              <rect x={x} y={76 + (i % 2) * 6} width="15" height="56" rx="7" fill={url(ids.top)} />
              <Nut x={x + 7} y={92 + (i % 2) * 6} a={80} />
              <Nut x={x + 8} y={114 + (i % 2) * 6} a={100} />
            </g>
          ))}
        </g>
      );
    }
    default: {
      // Assorted: a ladoo, a katli and a barfi together.
      return (
        <g>
          <Slab x={104} y={96} w={36} d={16} h={11} url={url} ids={ids} />
          <Pista x={116} y={102} a={-20} />
          <Pista x={128} y={106} a={25} />
          <path d="M78 104L102 114L78 124L54 114Z" fill={url(ids.top)} />
          <path d="M54 114L78 124L102 114L102 118L78 128L54 118Z" fill={tone.dark} />
          <Silver x={78} y={114} s={0.8} />
          <Sphere x={92} y={84} r={20} url={url} ids={ids} tone={tone} textured />
          <Sphere x={128} y={128} r={15} url={url} ids={ids} tone={tone} textured />
        </g>
      );
    }
  }
}

function Bowl({ kind, tone, garnish, url, ids, brass }: PartProps & { brass: boolean }) {
  const rim = 'M28 104A72 22 0 0 1 172 104';
  const front = 'M172 104A72 22 0 0 1 28 104';
  const liquid = tone.liquid ?? tone.dark;

  return (
    <g>
      <ellipse cx="100" cy="166" rx="66" ry="10" fill="#2d0a10" fillOpacity="0.1" />
      <ellipse cx="100" cy="104" rx="72" ry="22" fill={brass ? '#8f6420' : '#ddd3c3'} />
      <ellipse
        cx="100"
        cy="107"
        rx="66"
        ry="18"
        fill={kind === 'balls' || kind === 'rasmalai' ? liquid : tone.dark}
      />
      <path d={rim} fill="none" stroke={brass ? '#f2d58d' : '#d9ae5b'} strokeWidth="2.5" />

      {kind === 'balls' &&
        (
          [
            [64, 100, 19],
            [102, 94, 20],
            [138, 102, 18],
            [84, 114, 18],
            [120, 115, 18],
          ] as const
        ).map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r} fill={url(ids.ball)} />
            <ellipse
              cx={x - r * 0.35}
              cy={y - r * 0.4}
              rx={r * 0.3}
              ry={r * 0.16}
              fill="#fff"
              fillOpacity="0.7"
            />
          </g>
        ))}

      {kind === 'rasmalai' &&
        (
          [
            [70, 100],
            [112, 96],
            [140, 108],
            [96, 114],
          ] as const
        ).map(([x, y], i) => (
          <g key={`${x}-${y}`}>
            <ellipse cx={x} cy={y + 3} rx="19" ry="8" fill={tone.dark} />
            <ellipse cx={x} cy={y} rx="19" ry="8" fill={url(ids.top)} />
            <Pista x={x - 4} y={y - 1} a={i * 35} />
            <circle cx={x + 6} cy={y + 1} r="1.2" fill="#d9822b" />
          </g>
        ))}

      {(kind === 'halwa' || kind === 'namkeen' || kind === 'mix') && (
        <g>
          <path d="M36 108C52 70 78 58 100 58C122 58 148 70 164 108Z" fill={url(ids.ball)} />
          {kind !== 'halwa' && (
            <path d="M36 108C52 70 78 58 100 58C122 58 148 70 164 108Z" fill={url(ids.strands)} />
          )}
          {kind === 'halwa' && (
            <>
              <ellipse cx="86" cy="72" rx="16" ry="5" fill="#fff" fillOpacity="0.3" />
              {garnish === 'nuts' && (
                <>
                  <Nut x={92} y={66} a={-20} />
                  <Nut x={108} y={70} a={30} />
                  <Pista x={100} y={62} a={10} />
                  <Pista x={118} y={78} a={-30} />
                </>
              )}
            </>
          )}
          {kind === 'mix' &&
            (
              [
                [70, 92, '#6c9a3f'],
                [96, 74, '#c2412d'],
                [122, 86, '#6c9a3f'],
                [84, 84, '#f0d9a6'],
                [140, 98, '#f0d9a6'],
                [108, 96, '#c2412d'],
                [58, 102, '#f0d9a6'],
                [112, 66, '#6c9a3f'],
              ] as const
            ).map(([x, y, c]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" fill={c} />)}
        </g>
      )}

      {/* Front wall of the bowl, drawn last so contents sit inside it. */}
      <path
        d="M28 104C28 148 62 164 100 164C138 164 172 148 172 104A72 22 0 0 1 28 104Z"
        fill={url(ids.bowl)}
      />
      <path d={front} fill="none" stroke={brass ? '#f2d58d' : '#d9ae5b'} strokeWidth="2.5" />
      {!brass && (
        <path
          d="M36 128C52 146 76 152 100 152C124 152 148 146 164 128"
          fill="none"
          stroke="#d9ae5b"
          strokeWidth="1"
          strokeOpacity="0.7"
        />
      )}
      <path
        d="M44 118C50 136 64 146 78 150"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}
