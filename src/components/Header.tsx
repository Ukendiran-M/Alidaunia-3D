/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BRAND_ASSETS } from '../config/assets';
import { AppRoute, EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Mobile menu: focus moves into it on open; Escape closes it and returns focus to the toggle;
  // it also closes if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileMenuOpen(false);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia('(min-width: 768px)');
    const onDesktop = () => desktop.matches && setMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onDesktop);
    return () => {
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, route: AppRoute) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F5F6F7]/95 backdrop-blur-md border-b border-[#081C33]/10">
      <a href="#main-content" className="skip-link">Vai al contenuto</a>
      <div className="max-w-7xl mx-auto px-[16px] sm:px-[24px] lg:px-[32px]">
        {/* The bar is sized in px (80/96 + 1px rule) so it always matches --site-header-height, which
            sticky stages and pins offset from, even with enlarged browser text. */}
        <div className="flex items-center justify-between h-[80px] sm:h-[96px]">
          {/* Logo / Brand treatment */}
          <a
            href="/"
            onClick={(e) => handleNavClick(e, ROUTES.MANIFESTO)}
            aria-label="ALIDAUNIA SERVICES - Home"
            className="group flex shrink-0 items-center gap-[14px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] focus-visible:ring-offset-4 rounded-sm"
          >
            {!logoFailed ? (
              <img
                src={BRAND_ASSETS.logo.url}
                alt={BRAND_ASSETS.logo.alt}
                onError={() => setLogoFailed(true)}
                className="h-[40px] sm:h-[48px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            ) : null}

            <div className="flex flex-col justify-center">
              <span className="font-display text-[20px] sm:text-[24px] font-bold tracking-tight text-[#081C33] group-hover:text-[#0B4584] transition-colors leading-none">
                ALIDAUNIA
              </span>
              <span className="font-mono-tech text-[11px] sm:text-[12px] uppercase tracking-[0.24em] text-[#0B4584] font-semibold mt-1">
                SERVICES
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav aria-label="Navigazione principale" className="hidden md:flex items-center gap-8">
            <a
              href="/"
              onClick={(e) => handleNavClick(e, ROUTES.MANIFESTO)}
              aria-current={currentRoute === ROUTES.MANIFESTO ? 'page' : undefined}
              className={`relative inline-flex min-h-[44px] items-center py-2 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] rounded-sm ${
                currentRoute === ROUTES.MANIFESTO
                  ? 'text-[#0B4584]'
                  : 'text-[#081C33]/75 hover:text-[#081C33]'
              }`}
            >
              <span>Manifesto</span>
              {currentRoute === ROUTES.MANIFESTO && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0B4584]" />
              )}
            </a>

            <a
              href="/vision-mission-valori"
              onClick={(e) => handleNavClick(e, ROUTES.VISION)}
              aria-current={currentRoute === ROUTES.VISION ? 'page' : undefined}
              className={`relative inline-flex min-h-[44px] items-center py-2 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] rounded-sm ${
                currentRoute === ROUTES.VISION
                  ? 'text-[#0B4584]'
                  : 'text-[#081C33]/75 hover:text-[#081C33]'
              }`}
            >
              <span>Vision, Mission e Valori</span>
              {currentRoute === ROUTES.VISION && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0B4584]" />
              )}
            </a>

            <span className="h-4 w-px bg-[#081C33]/15" aria-hidden="true" />

            {/* External Contact Action */}
            <a
              href={EXTERNAL_LINKS.CONTACTS}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contatti ALIDAUNIA (apre sito aziendale in una nuova scheda)"
              className="inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 text-xs font-mono-tech uppercase tracking-wider font-semibold bg-[#0B4584] hover:bg-[#081C33] text-white transition-colors border border-[#0B4584] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] focus-visible:ring-offset-2"
            >
              <span>Contatti</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </nav>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-[8px] min-[375px]:gap-[12px]">
            {/* Below 375px the bar keeps logo and menu only; the same contact action leads the menu. */}
            <a
              href={EXTERNAL_LINKS.CONTACTS}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-[375px]:flex min-h-[44px] px-[14px] text-[12px] font-mono-tech uppercase font-semibold bg-[#0B4584] text-white items-center gap-[6px]"
              aria-label="Contatti (esterno)"
            >
              <span>Contatti</span>
              <ArrowUpRight className="w-[14px] h-[14px]" aria-hidden="true" />
            </a>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-controls="mobile-menu"
              className="p-[10px] text-[#081C33] hover:text-[#0B4584] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Chiudi menu di navigazione' : 'Apri menu di navigazione'}
            >
              {mobileMenuOpen ? <X className="w-[24px] h-[24px]" /> : <Menu className="w-[24px] h-[24px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer: overlays the page instead of pushing it (no layout shift under the sticky header). */}
      {mobileMenuOpen && (
        <div ref={drawerRef} id="mobile-menu" className="md:hidden absolute left-0 right-0 top-full max-h-[calc(100dvh-100%)] overflow-y-auto border-t border-[#081C33]/10 bg-[#F5F6F7] px-6 py-6 shadow-xl">
          <nav aria-label="Menu mobile" className="flex flex-col space-y-4">
            <a
              href="/"
              onClick={(e) => handleNavClick(e, ROUTES.MANIFESTO)}
              className={`flex items-center justify-between py-3 text-base font-semibold ${
                currentRoute === ROUTES.MANIFESTO
                  ? 'text-[#0B4584] pl-2 border-l-2 border-[#0B4584]'
                  : 'text-[#081C33]'
              }`}
            >
              <span>Manifesto</span>
              {currentRoute === ROUTES.MANIFESTO && (
                <span className="font-mono-tech text-xs bg-[#0B4584]/10 text-[#0B4584] px-2 py-0.5">
                  Attivo
                </span>
              )}
            </a>
            <a
              href="/vision-mission-valori"
              onClick={(e) => handleNavClick(e, ROUTES.VISION)}
              className={`flex items-center justify-between py-3 text-base font-semibold ${
                currentRoute === ROUTES.VISION
                  ? 'text-[#0B4584] pl-2 border-l-2 border-[#0B4584]'
                  : 'text-[#081C33]'
              }`}
            >
              <span>Vision, Mission e Valori</span>
              {currentRoute === ROUTES.VISION && (
                <span className="font-mono-tech text-xs bg-[#0B4584]/10 text-[#0B4584] px-2 py-0.5">
                  Attivo
                </span>
              )}
            </a>
            <div className="pt-4 border-t border-[#081C33]/10">
              <a
                href={EXTERNAL_LINKS.CONTACTS}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex min-h-11 items-center justify-center gap-2 py-3 bg-[#0B4584] text-white text-xs font-mono-tech uppercase font-semibold tracking-wider hover:bg-[#081C33]"
              >
                <span>Contatti Aziendali</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
