/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALIDAUNIA SERVICES - Vision, Mission e Valori Sections Configuration
 */

export interface MissionGroup {
  id: string;
  name: string;
  badge: string;
  points: {
    number: string;
    text: string;
    detail: string;
  }[];
}

export interface DesignPillar {
  id: string;
  title: string;
  focus: string;
  description: string;
}

export interface VisionSectionData {
  id: string;
  code: string;
  kicker: string;
  title: string;
  subtitle: string;
  body: string[];
}

export const VISION_SECTIONS: VisionSectionData[] = [
  {
    id: 'v1',
    code: 'V1',
    kicker: 'Identità & Radici',
    title: 'Innovativi per tradizione.',
    subtitle: "L'evoluzione continua fondata su una solida cultura aeronautica.",
    body: [
      "Guardare avanti significa padroneggiare la propria storia. L'esperienza maturata nella gestione di elisuperfici e rotte operative rappresenta la base solida per accogliere i nuovi paradigmi della mobilità aerea avanzata.",
      "Innoviamo nei metodi, nei materiali e nelle tecnologie di monitoraggio, mantenendo fermo il principio guida: la sicurezza operativa assoluta."
    ]
  },
  {
    id: 'v2',
    code: 'V2',
    kicker: 'Sostenibilità & Durata',
    title: 'Costruire un valore che resta nel tempo.',
    subtitle: 'Infrastrutture pensate per durare, evolversi e integrarsi nell’ambiente.',
    body: [
      "Progettare un'infrastruttura per il volo verticale significa pianificare un'opera destinata a servire la comunità nel tempo. Dalla scelta di pavimentazioni resistenti alle soluzioni energetiche efficienti, ogni dettaglio riduce l'impatto ambientale e favorisce la longevità dell'opera.",
      "Dal tratto essenziale del disegno preliminare alla struttura completata, creiamo valore tangibile per i committenti e per i territori."
    ]
  },
  {
    id: 'v3',
    code: 'V3',
    kicker: 'I Sette Punti della Mission',
    title: 'Dalla visione al lavoro quotidiano.',
    subtitle: 'I sette principi operativi articolati in tre aree di impegno.',
    body: [
      "La nostra missione si fonda su sette punti cardine: comprendere il contesto e innovare, progettare e costruire con criteri di eccellenza e sostenibilità, seguire e migliorare costantemente ogni infrastruttura.",
      "Questi principi guidano ogni scelta operativa e strategica per garantire approdi sicuri, efficienti e funzionali."
    ]
  },
  {
    id: 'v4',
    code: 'V4',
    kicker: 'I Quattro Pilastri',
    title: 'Il nostro modo di progettare.',
    subtitle: 'I quattro elementi che distinguono ogni nostra soluzione ingegneristica.',
    body: [
      "Esperienza, Tecnologia, Dinamismo e Modernità: non semplici parole chiave, ma i criteri con cui valutiamo ogni scelta tecnica.",
      "Dall'impiego di ausili visivi ottimali all'organizzazione razionale degli spazi a terra, il progetto riflette un'ingegneria orientata al futuro."
    ]
  },
  {
    id: 'v5',
    code: 'V5',
    kicker: 'Modello Relazionale',
    title: 'Il nostro modo di collaborare.',
    subtitle: 'Un legame virtuoso tra Cliente, Progetto e Gestione.',
    body: [
      "La riuscita di un'infrastruttura dipende dalla qualità della relazione tra chi commissiona l'opera, chi la progetta e chi ne cura l'esercizio nel tempo.",
      "Fondiamo ogni collaborazione su quattro valori relazionali fondamentali: Assistenza, Professionalità, Integrazione e Trasparenza."
    ]
  },
  {
    id: 'v6',
    code: 'V6',
    kicker: 'Inizia il Percorso',
    title: 'Diamo forma al tuo prossimo progetto.',
    subtitle: 'Dalla prima valutazione di fattibilità alla realizzazione e gestione.',
    body: [
      "Che si tratti di un'elisuperficie ospedaliera, di un approdo costiero o di un vertiporto per la mobilità avanzata, mettiamo a disposizione competenza, metodo e visione d'insieme.",
      "Contatta il nostro team tecnico per avviare uno studio preliminare o richiedere una consulenza specialistica."
    ]
  }
];

/**
 * 7 Original Mission Points organized into the 3 designated thematic groups:
 * 1. Comprendere e innovare (Dinamiche di mercato, Nuove idee, Salda memoria)
 * 2. Progettare e costruire (Costruire bene, Sviluppo eco-sostenibile)
 * 3. Seguire e migliorare (Orientamento alla qualità, Soddisfazione del cliente)
 */
export const V3_MISSION_GROUPS: MissionGroup[] = [
  {
    id: 'comprendere-e-innovare',
    name: 'Comprendere e innovare',
    badge: 'AREA 01',
    points: [
      {
        number: '01',
        text: 'Dinamiche di mercato',
        detail: 'Analisi approfondita dell’evoluzione della mobilità aerea, delle esigenze territoriali e dei flussi di connessione.'
      },
      {
        number: '02',
        text: 'Nuove idee',
        detail: 'Apertura all’innovazione tecnologica, a nuovi materiali e a soluzioni all’avanguardia per il volo verticale.'
      },
      {
        number: '03',
        text: 'Salda memoria',
        detail: 'Valorizzazione del patrimonio di esperienza maturato in decenni di attività aeronautica diretta sul campo.'
      }
    ]
  },
  {
    id: 'progettare-e-costruire',
    name: 'Progettare e costruire',
    badge: 'AREA 02',
    points: [
      {
        number: '04',
        text: 'Costruire bene',
        detail: 'Rigore ingegneristico, precisione realizzativa e cura del dettaglio strutturale in ogni fase costruttiva.'
      },
      {
        number: '05',
        text: 'Sviluppo eco-sostenibile',
        detail: 'Attenzione all’impatto ambientale, all’efficienza energetica e alla sostenibilità a lungo termine delle infrastrutture.'
      }
    ]
  },
  {
    id: 'seguire-e-migliorare',
    name: 'Seguire e migliorare',
    badge: 'AREA 03',
    points: [
      {
        number: '06',
        text: 'Orientamento alla qualità',
        detail: 'Perseguimento costante di standard elevati nella gestione, nei controlli di sicurezza e nelle procedure operative.'
      },
      {
        number: '07',
        text: 'Soddisfazione del cliente',
        detail: 'Ascolto continuo dei committenti, risposte puntuali e affiancamento costante per il raggiungimento degli obiettivi prefissati.'
      }
    ]
  }
];

export const V4_DESIGN_PILLARS: DesignPillar[] = [
  {
    id: 'esperienza',
    title: 'Esperienza',
    focus: 'Solido background operativo sul campo',
    description: 'La profonda conoscenza del volo verticale guida la progettazione di spazi funzionali e immediatamente fruibili dai piloti.'
  },
  {
    id: 'tecnologia',
    title: 'Tecnologia',
    focus: 'Impianti visivi e diagnostica avanzata',
    description: 'Adottiamo sistemi di illuminazione, sensoristica meteo e pavimentazioni ad alte prestazioni studiate per resistere all’usura.'
  },
  {
    id: 'dinamismo',
    title: 'Dinamismo',
    focus: 'Flessibilità progettuale e rapidità di risposta',
    description: 'Capacità di adattare le soluzioni tecniche a contesti eterogenei: strutture sanitarie, zone costiere o aree montane.'
  },
  {
    id: 'modernita',
    title: 'Modernità',
    focus: 'Pronti per l’evoluzione del volo verticale e AAM',
    description: 'Concepiamo le superfici con predisposizioni per la mobilità aerea avanzata e l’efficienza operativa del futuro.'
  }
];

/**
 * The 4 Restored Relationship Values for V5
 */
export const V5_RELATIONSHIP_VALUES = [
  {
    title: 'Assistenza',
    desc: 'Supporto continuativo e affiancamento costante al committente durante tutte le fasi del ciclo di vita dell’infrastruttura.'
  },
  {
    title: 'Professionalità',
    desc: 'Competenza specialistica aeronautica, metodo ingegneristico e rispetto rigoroso delle buone pratiche di settore.'
  },
  {
    title: 'Integrazione',
    desc: 'Coordinamento armonico tra infrastruttura, territorio, aspetti tecnici e flussi operativi di terra e di volo.'
  },
  {
    title: 'Trasparenza',
    desc: 'Chiarezza, lealtà e dialogo aperto nella condivisione di scelte progettuali, tempi e impegni operativi.'
  }
];
