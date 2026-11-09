import { memo, useMemo } from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import type { ChartResponse } from '../api/types';
import { SIGNS } from '../api/types';
import { planetGlyph, signGlyph } from '../astro/glyphs';
import { aspectColors, colors, signColor } from '../theme';

/** Minimum angular spacing between planet glyphs, degrees. */
const MIN_GAP = 7;

/**
 * Spread glyph positions so they don't overlap, keeping each as close to its
 * true longitude as possible. Returns display longitudes in input order.
 */
function spreadLongitudes(longitudes: number[]): number[] {
  const order = longitudes.map((lon, i) => ({ i, lon, pos: lon })).sort((a, b) => a.lon - b.lon);
  const n = order.length;
  if (n < 2) return longitudes;
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let k = 0; k < n; k++) {
      const a = order[k]!;
      const b = order[(k + 1) % n]!;
      let gap = b.pos - a.pos;
      if (k === n - 1) gap += 360;
      if (gap < MIN_GAP) {
        const push = (MIN_GAP - gap) / 2;
        a.pos -= push;
        b.pos += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const out = new Array<number>(n);
  for (const o of order) out[o.i] = o.pos;
  return out;
}

interface Props {
  chart: ChartResponse;
  size: number;
}

function ChartWheelImpl({ chart, size }: Props) {
  const c = size / 2;
  const rOuter = c - 2;
  const rSignInner = rOuter * 0.84;
  const rHouseNum = rOuter * 0.42;
  const rAspect = rOuter * 0.36;
  const rPlanet = rOuter * 0.69;
  const asc = chart.angles.asc.longitude;

  // ASC on the left (9 o'clock), zodiac running counter-clockwise.
  const point = (lon: number, r: number) => {
    const a = Math.PI + ((lon - asc) * Math.PI) / 180;
    return { x: c + r * Math.cos(a), y: c - r * Math.sin(a) };
  };

  const display = useMemo(() => spreadLongitudes(chart.planets.map((p) => p.longitude)), [chart.planets]);

  const sectorPath = (startLon: number, r1: number, r2: number) => {
    const p1 = point(startLon, r1);
    const p2 = point(startLon + 30, r1);
    const p3 = point(startLon + 30, r2);
    const p4 = point(startLon, r2);
    // Increasing longitude runs counter-clockwise on screen → sweep-flag 0 on the outer arc.
    return `M${p1.x},${p1.y} A${r1},${r1} 0 0 0 ${p2.x},${p2.y} L${p3.x},${p3.y} A${r2},${r2} 0 0 1 ${p4.x},${p4.y} Z`;
  };

  const planetByName = new Map(chart.planets.map((p) => [p.name, p]));
  const glyphSize = size * 0.05;

  return (
    <Svg width={size} height={size}>
      {/* Zodiac ring */}
      {SIGNS.map((sign, i) => {
        const mid = point(i * 30 + 15, (rOuter + rSignInner) / 2);
        return (
          <G key={sign}>
            <Path
              d={sectorPath(i * 30, rOuter, rSignInner)}
              fill={i % 2 ? colors.surface : colors.surfaceAlt}
              stroke={colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={mid.x}
              y={mid.y}
              fontSize={size * 0.048}
              fill={signColor(sign)}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {signGlyph[sign]}
            </SvgText>
          </G>
        );
      })}

      {/* 5° ticks on the inner edge of the zodiac ring */}
      {Array.from({ length: 72 }, (_, i) => {
        const len = i % 2 === 0 ? 0.035 : 0.018;
        const p1 = point(i * 5, rSignInner);
        const p2 = point(i * 5, rSignInner * (1 - len));
        return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={colors.border} strokeWidth={1} />;
      })}

      <Circle cx={c} cy={c} r={rSignInner} fill={colors.bg} stroke={colors.border} strokeWidth={1} />
      <Circle cx={c} cy={c} r={rAspect} fill="none" stroke={colors.border} strokeWidth={1} />

      {/* House cusps; ASC/DSC and MC/IC axes emphasized */}
      {chart.houses.map((h, i) => {
        const isAxis = i % 3 === 0;
        const p1 = point(h.cusp, rSignInner);
        const p2 = point(h.cusp, rAspect);
        const next = chart.houses[(i + 1) % 12]!.cusp;
        const span = (next - h.cusp + 360) % 360;
        const num = point(h.cusp + span / 2, rHouseNum);
        return (
          <G key={h.number}>
            <Line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isAxis ? colors.accent : colors.border}
              strokeWidth={isAxis ? 1.6 : 1}
            />
            <SvgText
              x={num.x}
              y={num.y}
              fontSize={size * 0.028}
              fill={colors.muted}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {h.number}
            </SvgText>
          </G>
        );
      })}

      {/* Axis labels just outside the ring */}
      {[
        { lon: chart.angles.asc.longitude, label: 'AC' },
        { lon: chart.angles.mc.longitude, label: 'MC' },
      ].map(({ lon, label }) => {
        const p = point(lon, rSignInner - size * 0.03);
        return (
          <SvgText
            key={label}
            x={p.x}
            y={p.y}
            fontSize={size * 0.026}
            fontWeight="bold"
            fill={colors.accent}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {label}
          </SvgText>
        );
      })}

      {/* Aspect lines (conjunctions have no line) */}
      {chart.aspects
        .filter((a) => a.type !== 'conjunction')
        .map((a) => {
          const p1 = planetByName.get(a.planet1);
          const p2 = planetByName.get(a.planet2);
          if (!p1 || !p2) return null;
          const s = point(p1.longitude, rAspect);
          const e = point(p2.longitude, rAspect);
          return (
            <Line
              key={`${a.planet1}-${a.planet2}`}
              x1={s.x}
              y1={s.y}
              x2={e.x}
              y2={e.y}
              stroke={aspectColors[a.type]}
              strokeOpacity={Math.max(0.35, 1 - a.orb / 9)}
              strokeWidth={1.2}
            />
          );
        })}

      {/* Planets: tick at the true position, glyph at the spread-out position */}
      {chart.planets.map((p, i) => {
        const tick1 = point(p.longitude, rSignInner);
        const tick2 = point(p.longitude, rSignInner * 0.95);
        const g = point(display[i]!, rPlanet);
        const leader = point(display[i]!, rPlanet + glyphSize * 0.9);
        const dot = point(p.longitude, rAspect);
        return (
          <G key={p.name}>
            <Line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke={colors.text} strokeWidth={1.4} />
            <Line x1={tick2.x} y1={tick2.y} x2={leader.x} y2={leader.y} stroke={colors.border} strokeWidth={0.8} />
            <Circle cx={dot.x} cy={dot.y} r={1.8} fill={colors.text} />
            <SvgText
              x={g.x}
              y={g.y}
              fontSize={glyphSize}
              fill={p.retrograde ? colors.danger : colors.text}
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {planetGlyph[p.name]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export const ChartWheel = memo(ChartWheelImpl);
