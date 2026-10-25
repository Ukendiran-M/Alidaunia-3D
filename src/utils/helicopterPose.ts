/** Scroll poses for the prepared AW139. Aircraft asset: Bannerz / CC BY 4.0. */
import { AW139_ASSEMBLY_GROUPS } from '../config/aw139Assembly';

export interface GroupTiming { name: string; order: number }
export interface GroupConfig extends GroupTiming { offset: readonly [number, number, number] }
export const ASSEMBLY_GROUPS: readonly GroupConfig[] = AW139_ASSEMBLY_GROUPS;

export interface HelicopterAssemblyState {
  headingOpacity: number;
  groupFactors: Record<string, number>;
  departureProgress: number;
  rotorAngle: number;
  explosionLift: number;
  liftPosition: [number, number, number];
  bankRotation: [number, number, number];
  stageName: 'assembled-intro' | 'exploding' | 'exploded-hold' | 'reassembling' | 'reassembled-hold' | 'departure';
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

/** All transforms derive from the current progress; no frame-to-frame accumulation. */
export function computeAssemblyState(progress: number, groups: readonly GroupTiming[] = ASSEMBLY_GROUPS): HelicopterAssemblyState {
  const p = clamp(Number.isFinite(progress) ? progress : 0);
  const maximumOrder = Math.max(1, ...groups.map((g) => g.order));
  const groupFactors: Record<string, number> = {};
  for (const g of groups) {
    let factor = 0;
    if (p > 0.12 && p <= 0.43) {
      const delay = (g.order / (maximumOrder + 1)) * 0.25;
      factor = smoothstep(delay, 1, (p - 0.12) / 0.31);
    } else if (p > 0.43 && p <= 0.51) {
      factor = 1;
    } else if (p > 0.51 && p <= 0.8) {
      const delay = ((maximumOrder - g.order) / (maximumOrder + 1)) * 0.25;
      factor = 1 - smoothstep(delay, 1, (p - 0.51) / 0.29);
    }
    groupFactors[g.name] = factor;
  }
  const departureProgress = smoothstep(0.88, 1, p);
  const explosionLift = 1.15 * (smoothstep(0.13, 0.37, p) - smoothstep(0.55, 0.8, p));
  let stageName: HelicopterAssemblyState['stageName'] = 'assembled-intro';
  if (p > 0.12 && p <= 0.43) stageName = 'exploding';
  else if (p > 0.43 && p <= 0.51) stageName = 'exploded-hold';
  else if (p > 0.51 && p <= 0.8) stageName = 'reassembling';
  else if (p > 0.8 && p <= 0.88) stageName = 'reassembled-hold';
  else if (p > 0.88) stageName = 'departure';
  return {
    headingOpacity: 1 - smoothstep(0.12, 0.22, p),
    groupFactors,
    departureProgress,
    rotorAngle: departureProgress * Math.PI * 16,
    explosionLift,
    liftPosition: [departureProgress * 7, explosionLift + departureProgress * 3.8, departureProgress * -4],
    bankRotation: [departureProgress * 0.045, departureProgress * -0.15, departureProgress * -0.09],
    stageName,
  };
}
