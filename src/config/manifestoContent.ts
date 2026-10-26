/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Manifesto Sections Configuration
 */

export interface InfrastructureLayer {
  id: string;
  name: string;
  description: string;
}

export interface ProjectPhase {
  number: string;
  title: string;
  description: string;
  details: string[];
}

export interface NetworkNode {
  id: string;
  name: string;
  role: string;
  x: number; // percentage in schematic map
  y: number;
  isHub?: boolean;
}

export interface NetworkConnection {
  from: string;
  to: string;
}

export interface ManifestoSectionData {
  id: string;
  code: string;
  kicker: string;
  title: string;
  subtitle: string;
  body: string[];
}

export const MANIFESTO_SECTIONS: ManifestoSectionData[] = [
  {
    id: 'm1',
    code: 'M1',
    kicker: 'MANIFESTO',
    title: "Prima del volo, c'è un progetto.",
    subtitle: 'Soluzioni complete e personalizzate per eliporti, elisuperfici e vertiporti, dal progetto alla gestione.',
    body: []
  },
  {
    id: 'm2',
    code: 'M2',
    kicker: 'Ingegneria di Sistema',
    title: 'Ogni infrastruttura è un sistema.',
    subtitle: 'La perfetta coesione tra piano strutturale, impianti tecnologici e flussi a terra.',
    body: [
      "Ogni operazione di decollo e atterraggio è il compimento visibile di un percorso invisibile: analisi del territorio, studio delle traiettorie di avvicinamento e definizione accurata delle superfici di sicurezza.",
      "Ogni progetto integra esigenze operative, sicurezza e funzionalità, con attenzione ai requisiti applicabili e alla continuità del servizio.",
      "Un eliporto o vertiporto non è una semplice piattaforma in cemento, ma la sintesi coordinata di livelli indipendenti che devono operare in sincronia perfetta.",
      "Dalle fondamenta geotecniche alla segnaletica luminosa, ciascun elemento risponde a criteri di sicurezza e a buone pratiche operative maturate sul campo."
    ]
  },
  {
    id: 'm3',
    code: 'M3',
    kicker: 'Metodo Operativo',
    title: 'Scegli un approccio integrato.',
    subtitle: 'Un percorso continuativo dalla fattibilità preliminare alla gestione quotidiana.',
    body: [
      "Separare la fase di progettazione da quella costruttiva o gestionale crea inefficienze e rallentamenti. Il nostro metodo connette l'intero ciclo di vita dell'infrastruttura.",
      "Seguiamo ogni fase con responsabilità diretta, anticipando le esigenze di manutenzione fin dai primi rilievi sul sito."
    ]
  },
  {
    id: 'm4',
    code: 'M4',
    kicker: 'Know-how Aeronautico',
    title: "Affidati all'esperienza.",
    subtitle: 'Decenni di operazioni sul campo per realizzare infrastrutture sicure ed efficienti.',
    body: [
      "Chi pianifica e gestisce infrastrutture di volo deve conoscere in prima persona le esigenze dei piloti, del personale di soccorso e dei team tecnici di terra.",
      "La nostra esperienza nasce da migliaia di ore operative, trasformate in linee guida concrete per la progettazione in contesti urbani, montani e ospedalieri complessi."
    ]
  },
  {
    id: 'm5',
    code: 'M5',
    kicker: 'Connettività Territoriale',
    title: "Una rete, una visione d'insieme.",
    subtitle: 'Nodi interconnessi per unire territori, presidi medici e corridoi strategici.',
    body: [
      "Il valore di una pista per il volo verticale si moltiplica quando diventa nodo di una rete integrata. Da Foggia ai punti di collegamento sul territorio, creiamo collegamenti veloci e affidabili.",
      "Progettiamo sistemi capaci di supportare sia le rotte di collegamento territoriale che le missioni di soccorso ed emergenza."
    ]
  },
  {
    id: 'm6',
    code: 'M6',
    kicker: 'Principi Fondanti',
    title: 'I principi che guidano ogni progetto.',
    subtitle: 'Rigore progettuale, sicurezza e continuità del servizio.',
    body: [
      "Ogni nostro intervento si fonda su tre pilastri imprescindibili: conformità tecnica, trasparenza nella cooperazione con committenti pubblici e privati, e cura costante della sostenibilità gestionale.",
      "Siamo pronti ad accompagnarti nello sviluppo del tuo prossimo approdo per il volo verticale."
    ]
  }
];

export const M2_INFRASTRUCTURE_LAYERS: InfrastructureLayer[] = [
  {
    id: 'layer-1',
    name: '01. Base Geotecnica & Drenaggio',
    description: 'Sottofondo calibrato, pendenze per lo smaltimento acque e capacità di carico ad alta resistenza.'
  },
  {
    id: 'layer-2',
    name: '02. Piastra Strutturale FATO',
    description: 'Area di approccio e decollo con finitura antiscivolo ad alta aderenza e resistenza a carichi rotorici.'
  },
  {
    id: 'layer-3',
    name: '03. Cerchio TLOF & Marcatura H',
    description: 'Area di contatto e sollevamento con segnaletica ottica per orientamento diurno e notturno.'
  },
  {
    id: 'layer-4',
    name: '04. Circuito Luci Perimetrali & Antincendio',
    description: 'Segnalatori luminosi perimetrali, ausili visivi e presidi di sicurezza dedicati.'
  },
  {
    id: 'layer-5',
    name: '05. Fascia di Sicurezza & Vie di Transito',
    description: 'Fascia perimetrale libera da ostacoli, indicatore di direzione del vento e percorsi protetti.'
  }
];

export const M3_PROJECT_PHASES: ProjectPhase[] = [
  {
    number: '01',
    title: 'Analisi',
    description: 'Studio di fattibilità tecnico-aeronautica e valutazione del contesto territoriale.',
    details: [
      'Rilievi orografici e analisi degli ostacoli nelle aree limitrofe',
      'Valutazione dei vincoli paesaggistici e ambientali',
      'Studio della tipologia di aeromobili previsti'
    ]
  },
  {
    number: '02',
    title: 'Progetto',
    description: 'Ingegneria di dettaglio civile, strutturale, impiantistica e di sicurezza.',
    details: [
      'Dimensionamento geometrico delle aree di manovra e atterraggio',
      'Progettazione degli aiuti visivi e sistemi ausiliari',
      'Elaborazione della documentazione tecnica di progetto'
    ]
  },
  {
    number: '03',
    title: 'Realizzazione',
    description: 'Coordinamento dei lavori, allestimento tecnologico e collaudi.',
    details: [
      'Supervisione dei lavori e posa delle superfici di volo',
      'Installazione delle dotazioni e dei sistemi di sicurezza',
      'Verifiche di conformità e collaudo operativo'
    ]
  },
  {
    number: '04',
    title: 'Gestione',
    description: 'Supporto continuativo, manutenzione programmata ed esercizio.',
    details: [
      'Piani di ispezione e monitoraggio delle superfici',
      'Aggiornamento continuo delle procedure operative',
      'Supporto specialistico per attività elisanitarie e di linea'
    ]
  }
];

export const M5_NETWORK_NODES: NetworkNode[] = [
  { id: 'foggia', name: 'Foggia', role: 'Hub Centrale & Base Operativa', x: 26, y: 58, isHub: true },
  { id: 'tremiti', name: 'Isole Tremiti (San Domino)', role: 'Approdo Insulare Collegato', x: 50, y: 16 },
  { id: 'vieste', name: 'Vieste', role: 'Elisuperficie Costiera', x: 78, y: 38 },
  { id: 'peschici', name: 'Peschici', role: 'Elisuperficie Territoriale', x: 68, y: 24 },
  { id: 'san-giovanni', name: 'San Giovanni Rotondo', role: 'Snodo Ospedaliero & Santuario', x: 44, y: 46 },
  { id: 'rete-regionale', name: 'Rete Regionale Elisanitaria', role: 'Presidi di Pronto Intervento', x: 74, y: 74 }
];

export const M5_NETWORK_CONNECTIONS: NetworkConnection[] = [
  { from: 'foggia', to: 'tremiti' },
  { from: 'foggia', to: 'vieste' },
  { from: 'foggia', to: 'san-giovanni' },
  { from: 'vieste', to: 'peschici' },
  { from: 'peschici', to: 'tremiti' },
  { from: 'san-giovanni', to: 'rete-regionale' },
  { from: 'foggia', to: 'rete-regionale' }
];

export interface GuidingPrinciple {
  title: string;
  description: string;
}

export const M6_PRINCIPLES: GuidingPrinciple[] = [
  {
    title: 'Sicurezza Senza Compromessi',
    description: "Priorità all'analisi attenta degli spazi operativi, alla regolarità dei flussi e all'efficienza dei presidi di sicurezza a terra."
  },
  {
    title: 'Rigore Progettuale & Precisione',
    description: "Metodo ingegneristico accurato, dai primi rilievi geometrici fino al collaudo operativo e all'avvio in esercizio."
  },
  {
    title: 'Continuità del Servizio',
    description: 'Accompagnamento costante degli approdi attraverso protocolli di manutenzione e coordinamento operativo di terra.'
  }
];
