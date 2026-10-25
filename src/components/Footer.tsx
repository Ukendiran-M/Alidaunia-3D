/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppRoute, EXTERNAL_LINKS, ROUTES } from '../utils/navigation';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#081C33] text-[#F5F6F7] border-t border-[#081C33]/20 relative z-20">
      {/* Top Red-Blue Technical Accent Line */}
      <div className="w-full h-1 bg-gradient-to-r from-[#0B4584] via-[#E31E24] to-[#0B4584]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand & Purpose Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex flex-col">
              <span className="font-display text-2xl font-bold tracking-tight text-white">
                ALIDAUNIA
              </span>
              <span className="font-mono-tech text-xs uppercase tracking-[0.25em] text-[#0B4584] font-semibold mt-0.5">
                SERVICES
              </span>
            </div>
            <p className="text-sm text-[#F5F6F7]/75 leading-relaxed font-sans max-w-md pt-2">
              Pianificazione integrata, progettazione tecnica, realizzazione e gestione operativa 
              di eliporti, elisuperfici e vertiporti. Competenza aeronautica al servizio di territori,
              strutture sanitarie e mobilità aerea avanzata.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-mono-tech text-xs uppercase tracking-widest text-[#F5F6F7]/50 font-semibold">
              Navigazione
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onNavigate(ROUTES.MANIFESTO);
                  }}
                  className="text-[#F5F6F7]/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] text-left"
                >
                  Manifesto
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onNavigate(ROUTES.VISION);
                  }}
                  className="text-[#F5F6F7]/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4584] text-left"
                >
                  Vision, Mission e Valori
                </button>
              </li>
            </ul>
          </div>

          {/* Contact and Corporate Link */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-mono-tech text-xs uppercase tracking-widest text-[#F5F6F7]/50 font-semibold">
              Contatti Istituzionali
            </h3>
            <p className="text-xs text-[#F5F6F7]/70 leading-relaxed font-sans">
              Per informazioni, studi di fattibilità o consulenze sulla gestione di infrastrutture di volo verticale:
            </p>
            <div className="pt-1">
              <a
                href={EXTERNAL_LINKS.CONTACTS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 text-xs font-mono-tech uppercase tracking-wider font-semibold bg-[#0B4584] hover:bg-white hover:text-[#081C33] text-white transition-colors border border-[#0B4584]"
              >
                <span>Contatta Alidaunia</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
            <div className="pt-2">
              <a
                href={EXTERNAL_LINKS.COMPANY_HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#F5F6F7]/50 hover:text-[#F5F6F7]/90 transition-colors inline-flex items-center gap-1 font-mono-tech"
              >
                alidaunia.it
              </a>
            </div>
          </div>
        </div>

        {/* Technical baseline footer */}
        <div className="mt-16 pt-8 border-t border-[#F5F6F7]/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tech text-[#F5F6F7]/50 gap-4">
          <div>
            © {new Date().getFullYear()} ALIDAUNIA SERVICES. Tutti i diritti riservati.
          </div>
          <div>
            Pianificazione, consegna e gestione di elisuperfici e vertiporti
          </div>
        </div>
      </div>
    </footer>
  );
};
