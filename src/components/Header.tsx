/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, route: AppRoute) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F5F6F7]/95 backdrop-blur-md border-b border-[#081C33]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo / Brand treatment */}
          <a
            href="/"
            onClick={(e) => handleNavClick(e, ROUTES.MANIFESTO)}
            aria-label="ALIDAUNIA SERVICES - Home"
            className="group flex items-center gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] focus-visible:ring-offset-4 rounded-sm"
          >
            {!logoFailed ? (
              <img
                src={BRAND_ASSETS.logo.url}
                alt={BRAND_ASSETS.logo.alt}
                onError={() => setLogoFailed(true)}
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
            ) : null}

            <div className="flex flex-col justify-center">
              <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#081C33] group-hover:text-[#0B4584] transition-colors leading-none">
                ALIDAUNIA
              </span>
              <span className="font-mono-tech text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#0B4584] font-semibold mt-1">
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
              className={`relative py-2 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] rounded-sm ${
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
              className={`relative py-2 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] rounded-sm ${
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono-tech uppercase tracking-wider font-semibold bg-[#0B4584] hover:bg-[#081C33] text-white transition-colors border border-[#0B4584] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] focus-visible:ring-offset-2"
            >
              <span>Contatti</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </nav>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-3">
            <a
              href={EXTERNAL_LINKS.CONTACTS}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-mono-tech uppercase font-semibold bg-[#0B4584] text-white flex items-center gap-1.5"
              aria-label="Contatti (esterno)"
            >
              <span>Contatti</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#081C33] hover:text-[#0B4584] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584]"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Chiudi menu di navigazione' : 'Apri menu di navigazione'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#081C33]/10 bg-[#F5F6F7] px-6 py-6 shadow-xl animate-in fade-in duration-150">
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
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0B4584] text-white text-xs font-mono-tech uppercase font-semibold tracking-wider hover:bg-[#081C33]"
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
