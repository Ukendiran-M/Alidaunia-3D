/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppRoute, normalizePath, ROUTES } from './utils/navigation';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ManifestoPage } from './pages/ManifestoPage';
import { VisionPage } from './pages/VisionPage';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    normalizePath(window.location.pathname)
  );

  // Synchronize on route changes and kill dangling ScrollTriggers
  const handleNavigate = useCallback((newRoute: AppRoute) => {
    if (newRoute === currentRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Kill any existing ScrollTrigger instances before route switch to prevent pin spacing leaks
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.clearMatchMedia();

    window.history.pushState(null, '', newRoute);
    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentRoute]);

  // Handle browser back and forward history
  useEffect(() => {
    const onPopState = () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      setCurrentRoute(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F7] text-[#081C33] selection:bg-[#0B4584] selection:text-white">
      {/* Shared Header with navigation, approved logo/treatment, and external contacts */}
      <Header currentRoute={currentRoute} onNavigate={handleNavigate} />

      {/* Main Page Stage according to active route */}
      <main id="main-content" className="flex-1 w-full" tabIndex={-1}>
        {currentRoute === ROUTES.VISION ? (
          <VisionPage onNavigate={handleNavigate} />
        ) : (
          <ManifestoPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Shared Editorial Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
