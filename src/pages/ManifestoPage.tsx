/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Manifesto Page
 * Full-width stacked architectural chapters:
 * M1: Real Three.js 3D Helicopter Assembly & Takeoff Hero
 * M2: Architectural Project Drawing Unrolling & Linework Reveal
 * M3: In-Place Site Lifecycle 3D Evolution (Analisi -> Gestione)
 * M4: Operations Photographic Reveal with Solid Bevelled Frame
 * M5: 3D Conceptual Network Board with Spatial Arcs
 * M6: Closing Principles Section with Quiet Finished Heliport & Navigation
 */

import React, { useEffect, useRef } from 'react';
import { HelicopterAssemblyHero } from '../components/HelicopterAssemblyHero';
import { InfrastructureAssemblySection } from '../components/InfrastructureAssemblySection';
import { ProjectLifecycleSection } from '../components/ProjectLifecycleSection';
import { OperationsSection } from '../components/OperationsSection';
import { NetworkSection } from '../components/NetworkSection';
import { ClosingPrinciplesSection } from '../components/ClosingPrinciplesSection';
import { ROUTES } from '../utils/navigation';

interface ManifestoPageProps {
  onNavigate?: (route: typeof ROUTES.VISION) => void;
}

export const ManifestoPage: React.FC<ManifestoPageProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Manifesto | ALIDAUNIA SERVICES";
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-[#F5F6F7] text-[#081C33]">
      {/* SECTION M1: Real Three.js 3D Helicopter Exploded-View and Reassembly Hero */}
      <HelicopterAssemblyHero />

      {/* SECTION M2: Architectural Project Drawing Unrolling & Coordinated Systems Reveal */}
      <InfrastructureAssemblySection />

      {/* SECTION M3: In-place 3D site evolution across Analisi, Progetto, Realizzazione and Gestione */}
      <ProjectLifecycleSection />

      {/* SECTION M4: Centred operations image with shallow 3D architectural reveal */}
      <OperationsSection />

      {/* SECTION M5: 3D Conceptual network diagram on architectural board */}
      <NetworkSection />

      {/* SECTION M6: Calm closing principles composition with quiet finished 3D heliport */}
      <ClosingPrinciplesSection onNavigate={onNavigate} />
    </div>
  );
};
