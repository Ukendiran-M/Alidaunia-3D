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
