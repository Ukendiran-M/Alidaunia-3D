/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Visual Asset Configuration
 */

export interface VisualAsset {
  id: string;
  url: string;
  alt: string;
  referenceOnly: boolean;
  type: 'photo' | 'vector';
}

export const BRAND_ASSETS = {
  logo: {
    id: 'brand-logo',
    url: '/brand/alidaunia-logo.svg',
    alt: 'Logo Alidaunia Services',
    referenceOnly: false,
    type: 'vector' as const,
  },
  manifestoStill: {
    id: 'manifesto-hero-still',
    url: '/brand/manifesto-hero.jpg',
    alt: 'Infrastruttura per volo verticale Alidaunia',
    referenceOnly: true,
    type: 'photo' as const,
  },
  operationsReference: {
    id: 'operations-reference',
    url: '/brand/vision-operations.jpeg',
    alt: 'Operazioni e coordinamento di terra per volo verticale',
    referenceOnly: true,
    type: 'photo' as const,
  },
  missionReference: {
    id: 'mission-reference',
    url: '/brand/mission-reference.png',
    alt: 'Pianificazione e contesto infrastrutturale',
    referenceOnly: true,
    type: 'photo' as const,
  },
  valuesReference: {
    id: 'values-reference',
    url: '/brand/values-reference.png',
    alt: 'Infrastruttura e standard operativi per il volo verticale',
    referenceOnly: true,
    type: 'photo' as const,
  },
} as const;

export const HERO_ASSETS = {
  model: '/models/aw139-assembly.glb',
  environment: '/environments/studio_small_09_2k.hdr',
  mobileEnvironment: '/environments/studio_small_09_1k.hdr',
} as const;

export type ManifestoChapterAsset = {
  model: string;
  poster: string;
  clip: string;
  /** Fixed composition camera from the kit's asset-manifest.json (direction only; framing is fitted). */
  view: { position: [number, number, number]; target: [number, number, number] };
  tone: 'navy' | 'light';
};

/**
 * Manifesto M2–M6 object assets (Alidaunia_Manifesto_M2_M6_Kit). Illustrative
 * concept objects; GLBs embed their own maps. The 1K studio HDR is the same
 * file M1 uses on mobile, so the browser cache is shared.
 */
export const MANIFESTO_ASSETS = {
  environment: HERO_ASSETS.mobileEnvironment,
  chapters: {
    M2: {
      model: '/manifesto-assets/models/m2-systems-folio.glb',
      poster: '/manifesto-assets/posters/m2-settled.jpg',
      clip: 'M2_Unroll_Coordinate',
      view: { position: [6, 7.8, 9], target: [0, 0.25, 0] },
      tone: 'navy',
    },
    M3: {
      model: '/manifesto-assets/models/m3-site-lifecycle.glb',
      poster: '/manifesto-assets/posters/m3-settled.jpg',
      clip: 'M3_Analyse_Design_Build_Operate',
      view: { position: [9, 10, 11], target: [0, 0.1, 0] },
      tone: 'light',
    },
    M4: {
      model: '/manifesto-assets/models/m4-wind-operations.glb',
      poster: '/manifesto-assets/posters/m4-settled.jpg',
      clip: 'M4_Wind_Response',
      view: { position: [8, 4.8, 10], target: [0.2, 2.5, 0] },
      tone: 'navy',
    },
    M5: {
      model: '/manifesto-assets/models/m5-network-atlas.glb',
      poster: '/manifesto-assets/posters/m5-settled.jpg',
      clip: 'M5_Unfold_Connect',
      view: { position: [7, 9, 10], target: [0, 0.4, 0] },
      tone: 'light',
    },
    M6: {
      model: '/manifesto-assets/models/m6-brand-signature.glb',
      poster: '/manifesto-assets/posters/m6-settled.jpg',
      clip: 'M6_Precision_Register',
      view: { position: [2.3, 1.3, 11], target: [0, 0, 0] },
      tone: 'light',
    },
  } satisfies Record<'M2' | 'M3' | 'M4' | 'M5' | 'M6', ManifestoChapterAsset>,
} as const;
