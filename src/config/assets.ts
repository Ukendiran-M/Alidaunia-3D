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
    url: 'https://alidaunia.it/img/loghi/micro.svg',
    alt: 'Logo Alidaunia Services',
    referenceOnly: false,
    type: 'vector' as const,
  },
  manifestoStill: {
    id: 'manifesto-hero-still',
    url: 'https://alidaunia.vercel.app/images/manifesto_alidaunia_hero.png',
    alt: 'Infrastruttura per volo verticale Alidaunia',
    referenceOnly: true,
    type: 'photo' as const,
  },
  operationsReference: {
    id: 'operations-reference',
    url: 'https://alidaunia.vercel.app/images/image50.jpeg',
    alt: 'Operazioni e coordinamento di terra per volo verticale',
    referenceOnly: true,
    type: 'photo' as const,
  },
  missionReference: {
    id: 'mission-reference',
    url: 'https://alidaunia.vercel.app/images/mission_photo.png',
    alt: 'Pianificazione e contesto infrastrutturale',
    referenceOnly: true,
    type: 'photo' as const,
  },
  valuesReference: {
    id: 'values-reference',
    url: 'https://alidaunia.vercel.app/images/values_photo.png',
    alt: 'Infrastruttura e standard operativi per il volo verticale',
    referenceOnly: true,
    type: 'photo' as const,
  },
} as const;
