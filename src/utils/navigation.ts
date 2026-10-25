/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Navigation and Route Utilities
 */

export type AppRoute = '/' | '/vision-mission-valori';

export const ROUTES: { MANIFESTO: AppRoute; VISION: AppRoute } = {
  MANIFESTO: '/',
  VISION: '/vision-mission-valori',
};

export const EXTERNAL_LINKS = {
  CONTACTS: 'https://alidaunia.it/contacts',
  COMPANY_HOME: 'https://alidaunia.it',
};

/**
 * Normalizes any pathname into a recognized valid app route.
 */
export function normalizePath(pathname: string): AppRoute {
  if (!pathname) return ROUTES.MANIFESTO;
  
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  if (clean === '/vision-mission-valori' || clean.startsWith('/vision')) {
    return ROUTES.VISION;
  }

  return ROUTES.MANIFESTO;
}

/**
 * Checks whether a given route matches the current active pathname.
 */
export function isRouteActive(currentPath: string, targetRoute: AppRoute): boolean {
  return normalizePath(currentPath) === targetRoute;
}

/**
 * Returns the page title and kicker metadata.
 */
export function getRouteMetadata(route: AppRoute): {
  title: string;
  kicker: string;
} {
  if (route === ROUTES.VISION) {
    return {
      title: 'Vision, Mission e Valori | ALIDAUNIA SERVICES',
      kicker: 'Visione, Missione e Valori Guida',
    };
  }

  return {
    title: 'Manifesto | ALIDAUNIA SERVICES',
    kicker: 'Pianificazione, Realizzazione e Gestione Eliporti',
  };
}
