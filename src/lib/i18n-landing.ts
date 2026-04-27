/**
 * i18n for landing/welcome page
 *
 * Lightweight inline translations — no heavy i18n library needed.
 * Detects browser language via navigator.language and falls back to English.
 *
 * Supported: EN, DE, ES, FR, PT, IT, NL
 */

export type LangCode = 'en' | 'de' | 'es' | 'fr' | 'pt' | 'it' | 'nl';

const SUPPORTED_LANGS: LangCode[] = ['en', 'de', 'es', 'fr', 'pt', 'it', 'nl'];

export const LANG_LABELS: Record<LangCode, string> = {
  en: 'EN',
  de: 'DE',
  es: 'ES',
  fr: 'FR',
  pt: 'PT',
  it: 'IT',
  nl: 'NL',
};

export function detectLanguage(): LangCode {
  if (typeof navigator === 'undefined') return 'en';
  const raw = (navigator.language || '').toLowerCase();
  const prefix = raw.split('-')[0] as LangCode;
  if (SUPPORTED_LANGS.includes(prefix)) return prefix;
  return 'en';
}

type Translations = {
  // Gate (not installed)
  eyebrow: string;
  subtitle: string;
  valueTitle: string;
  valueBody: (hosts: number, countries: number, routes: number) => string;
  trustSafe: string;
  trustNoStore: string;
  trustPrivacy: string;
  independenceText: string;
  installBtnIOS: string;
  installBtnAndroid: string;
  installing: string;
  installNoteIOS: string;
  installNoteAndroid: string;
  techNote: string;

  // iOS Guide
  guideTitle: string;
  guideSubtitle: string;
  guideStep1Title: string;
  guideStep1Desc: string;
  guideStep1DescIPad: string;
  guideStep2Title: string;
  guideStep2Desc: string;
  guideStep3Title: string;
  guideStep3Desc: string;
  guidePointer: string;
  guideNext: string;

  // Installed state
  welcomeHome: string;
  beginBtn: string;
  signinLink: string;
  hostBanner: string;
  openDoors: string;
  ways: string;
  countries: string;

  // Badge
  badgeLine1: string;
  badgeLine2: string;
};

const en: Translations = {
  eyebrow: 'EST. MMXXVI',
  subtitle: 'Walk the ancient ways.\nStay with those who walk them too.',
  valueTitle: 'A network of open doors',
  valueBody: (h, c, r) =>
    `${h}+ hosts across ${c} countries welcome wanderers along ${r} historic walking routes. Free stays, shared meals, and real human connection — no booking fees, no middlemen.`,
  trustSafe: 'Perfectly safe',
  trustNoStore: 'No app store',
  trustPrivacy: 'Your data stays yours',
  independenceText:
    'Wanderkind is independent — not an app store product, not a corporation. For the perfect experience, install it directly to your phone. Lightweight, instant, free.',
  installBtnIOS: 'ADD TO HOME SCREEN',
  installBtnAndroid: 'INSTALL WANDERKIND',
  installing: 'INSTALLING...',
  installNoteIOS: 'Tap to see how — takes 10 seconds',
  installNoteAndroid: 'One tap — no app store needed',
  techNote: 'Installs as a lightweight web app (<2 MB). No tracking, no ads, no bloat.',

  guideTitle: 'Install Wanderkind',
  guideSubtitle: '3 quick steps — takes 10 seconds',
  guideStep1Title: 'Tap the Share button',
  guideStep1Desc: 'The square with an upward arrow — at the bottom of your browser',
  guideStep1DescIPad: 'The square with an upward arrow — at the top right of your browser',
  guideStep2Title: '"Add to Home Screen"',
  guideStep2Desc: '**Scroll down** the list — below the first options. Look for the + icon',
  guideStep3Title: 'Tap "Add"',
  guideStep3Desc: 'Wanderkind appears on your home screen — open it like any app',
  guidePointer: 'Share button is down here',
  guideNext: 'NEXT',

  welcomeHome: 'Welcome home, wanderer.',
  beginBtn: 'BECOME A WANDERKIND',
  signinLink: 'Already a Wanderkind',
  hostBanner: 'EVERY WANDERKIND IS ALSO A HOST',
  openDoors: 'OPEN DOORS',
  ways: 'WAYS',
  countries: 'COUNTRIES',

  badgeLine1: 'SECURE',
  badgeLine2: 'Direct Install',
};

const de: Translations = {
  eyebrow: 'GEGR. MMXXVI',
  subtitle: 'Geh die alten Wege.\nBleib bei denen, die sie auch gehen.',
  valueTitle: 'Ein Netzwerk offener Türen',
  valueBody: (h, c, r) =>
    `${h}+ Gastgeber in ${c} Ländern heißen Wanderer auf ${r} historischen Wanderwegen willkommen. Kostenlose Übernachtungen, gemeinsame Mahlzeiten und echte menschliche Verbindung — keine Buchungsgebühren, keine Vermittler.`,
  trustSafe: 'Absolut sicher',
  trustNoStore: 'Kein App Store',
  trustPrivacy: 'Deine Daten bleiben deine',
  independenceText:
    'Wanderkind ist unabhängig — kein App-Store-Produkt, kein Konzern. Für das perfekte Erlebnis installiere es direkt auf deinem Handy. Leicht, sofort, kostenlos.',
  installBtnIOS: 'ZUM STARTBILDSCHIRM',
  installBtnAndroid: 'WANDERKIND INSTALLIEREN',
  installing: 'WIRD INSTALLIERT...',
  installNoteIOS: 'Tippe hier — dauert 10 Sekunden',
  installNoteAndroid: 'Ein Tipp — kein App Store nötig',
  techNote: 'Installiert als leichte Web-App (<2 MB). Kein Tracking, keine Werbung.',

  guideTitle: 'Wanderkind installieren',
  guideSubtitle: '3 kurze Schritte — dauert 10 Sekunden',
  guideStep1Title: 'Tippe auf Teilen',
  guideStep1Desc: 'Das Quadrat mit dem Pfeil nach oben — unten im Browser',
  guideStep1DescIPad: 'Das Quadrat mit dem Pfeil nach oben — oben rechts im Browser',
  guideStep2Title: '„Zum Home-Bildschirm"',
  guideStep2Desc: '**Scrolle nach unten** in der Liste — unter den ersten Optionen. Achte auf das + Symbol',
  guideStep3Title: 'Tippe auf „Hinzufügen"',
  guideStep3Desc: 'Wanderkind erscheint auf deinem Startbildschirm — öffne es wie jede App',
  guidePointer: 'Teilen-Button ist hier unten',
  guideNext: 'WEITER',

  welcomeHome: 'Willkommen zu Hause, Wanderer.',
  beginBtn: 'WERDE EIN WANDERKIND',
  signinLink: 'Schon ein Wanderkind',
  hostBanner: 'JEDES WANDERKIND IST AUCH EIN GASTGEBER',
  openDoors: 'OFFENE TÜREN',
  ways: 'WEGE',
  countries: 'LÄNDER',

  badgeLine1: 'SICHER',
  badgeLine2: 'Direkt installieren',
};

const es: Translations = {
  eyebrow: 'EST. MMXXVI',
  subtitle: 'Camina las rutas antiguas.\nQuédate con quienes también las recorren.',
  valueTitle: 'Una red de puertas abiertas',
  valueBody: (h, c, r) =>
    `${h}+ anfitriones en ${c} países dan la bienvenida a caminantes en ${r} rutas históricas. Estancias gratuitas, comidas compartidas y conexión humana real — sin comisiones, sin intermediarios.`,
  trustSafe: 'Totalmente seguro',
  trustNoStore: 'Sin app store',
  trustPrivacy: 'Tus datos son tuyos',
  independenceText:
    'Wanderkind es independiente — no es un producto de app store, ni una corporación. Para la experiencia perfecta, instálalo directamente en tu teléfono. Ligero, instantáneo, gratis.',
  installBtnIOS: 'AÑADIR A INICIO',
  installBtnAndroid: 'INSTALAR WANDERKIND',
  installing: 'INSTALANDO...',
  installNoteIOS: 'Toca para ver cómo — 10 segundos',
  installNoteAndroid: 'Un toque — sin app store',
  techNote: 'Se instala como app web ligera (<2 MB). Sin rastreo, sin anuncios.',

  guideTitle: 'Instalar Wanderkind',
  guideSubtitle: '3 pasos rápidos — 10 segundos',
  guideStep1Title: 'Toca el botón Compartir',
  guideStep1Desc: 'El cuadrado con la flecha hacia arriba — en la parte inferior del navegador',
  guideStep1DescIPad: 'El cuadrado con la flecha hacia arriba — arriba a la derecha en el navegador',
  guideStep2Title: '"Añadir a pantalla de inicio"',
  guideStep2Desc: '**Desplázate hacia abajo** en la lista — debajo de las primeras opciones. Busca el icono +',
  guideStep3Title: 'Toca "Añadir"',
  guideStep3Desc: 'Wanderkind aparece en tu pantalla de inicio — ábrelo como cualquier app',
  guidePointer: 'El botón Compartir está aquí abajo',
  guideNext: 'SIGUIENTE',

  welcomeHome: 'Bienvenido a casa, caminante.',
  beginBtn: 'HAZTE WANDERKIND',
  signinLink: 'Ya soy Wanderkind',
  hostBanner: 'CADA WANDERKIND TAMBIÉN ES ANFITRIÓN',
  openDoors: 'PUERTAS ABIERTAS',
  ways: 'CAMINOS',
  countries: 'PAÍSES',

  badgeLine1: 'SEGURO',
  badgeLine2: 'Instalación directa',
};

const fr: Translations = {
  eyebrow: 'FOND. MMXXVI',
  subtitle: 'Marche sur les chemins anciens.\nReste avec ceux qui les parcourent aussi.',
  valueTitle: 'Un réseau de portes ouvertes',
  valueBody: (h, c, r) =>
    `${h}+ hôtes dans ${c} pays accueillent les marcheurs sur ${r} itinéraires historiques. Hébergement gratuit, repas partagés et vraie connexion humaine — sans frais, sans intermédiaires.`,
  trustSafe: 'Parfaitement sûr',
  trustNoStore: 'Sans app store',
  trustPrivacy: 'Tes données restent tiennes',
  independenceText:
    "Wanderkind est indépendant — pas un produit d'app store, pas une entreprise. Pour une expérience parfaite, installe-le directement sur ton téléphone. Léger, instantané, gratuit.",
  installBtnIOS: "AJOUTER À L'ÉCRAN",
  installBtnAndroid: 'INSTALLER WANDERKIND',
  installing: 'INSTALLATION...',
  installNoteIOS: 'Appuie pour voir — 10 secondes',
  installNoteAndroid: "Un appui — pas d'app store",
  techNote: "S'installe comme appli web légère (<2 Mo). Sans pistage, sans pub.",

  guideTitle: 'Installer Wanderkind',
  guideSubtitle: '3 étapes rapides — 10 secondes',
  guideStep1Title: 'Appuie sur Partager',
  guideStep1Desc: "Le carré avec la flèche vers le haut — en bas du navigateur",
  guideStep1DescIPad: "Le carré avec la flèche vers le haut — en haut à droite du navigateur",
  guideStep2Title: "\"Ajouter à l'écran d'accueil\"",
  guideStep2Desc: '**Fais défiler vers le bas** dans la liste — sous les premières options. Cherche l\'icône +',
  guideStep3Title: 'Appuie sur "Ajouter"',
  guideStep3Desc: "Wanderkind apparaît sur ton écran d'accueil — ouvre-le comme n'importe quelle app",
  guidePointer: 'Le bouton Partager est ici en bas',
  guideNext: 'SUIVANT',

  welcomeHome: 'Bienvenue chez toi, marcheur.',
  beginBtn: 'DEVIENS WANDERKIND',
  signinLink: 'Déjà Wanderkind',
  hostBanner: 'CHAQUE WANDERKIND EST AUSSI UN HÔTE',
  openDoors: 'PORTES OUVERTES',
  ways: 'CHEMINS',
  countries: 'PAYS',

  badgeLine1: 'SÉCURISÉ',
  badgeLine2: 'Installation directe',
};

const pt: Translations = {
  eyebrow: 'FUND. MMXXVI',
  subtitle: 'Caminha pelas rotas antigas.\nFica com aqueles que também as percorrem.',
  valueTitle: 'Uma rede de portas abertas',
  valueBody: (h, c, r) =>
    `${h}+ anfitriões em ${c} países acolhem caminhantes em ${r} rotas históricas. Estadia gratuita, refeições partilhadas e conexão humana real — sem taxas, sem intermediários.`,
  trustSafe: 'Totalmente seguro',
  trustNoStore: 'Sem app store',
  trustPrivacy: 'Os teus dados são teus',
  independenceText:
    'Wanderkind é independente — não é um produto de app store, nem uma corporação. Para a experiência perfeita, instala-o diretamente no teu telemóvel. Leve, instantâneo, grátis.',
  installBtnIOS: 'ADICIONAR AO ECRÃ',
  installBtnAndroid: 'INSTALAR WANDERKIND',
  installing: 'A INSTALAR...',
  installNoteIOS: 'Toca para ver como — 10 segundos',
  installNoteAndroid: 'Um toque — sem app store',
  techNote: 'Instala como app web leve (<2 MB). Sem rastreamento, sem anúncios.',

  guideTitle: 'Instalar Wanderkind',
  guideSubtitle: '3 passos rápidos — 10 segundos',
  guideStep1Title: 'Toca no botão Partilhar',
  guideStep1Desc: 'O quadrado com a seta para cima — na parte inferior do navegador',
  guideStep1DescIPad: 'O quadrado com a seta para cima — no canto superior direito do navegador',
  guideStep2Title: '"Adicionar ao ecrã inicial"',
  guideStep2Desc: '**Desliza para baixo** na lista — abaixo das primeiras opções. Procura o ícone +',
  guideStep3Title: 'Toca em "Adicionar"',
  guideStep3Desc: 'Wanderkind aparece no teu ecrã — abre-o como qualquer app',
  guidePointer: 'O botão Partilhar está aqui em baixo',
  guideNext: 'SEGUINTE',

  welcomeHome: 'Bem-vindo a casa, caminhante.',
  beginBtn: 'TORNA-TE WANDERKIND',
  signinLink: 'Já sou Wanderkind',
  hostBanner: 'CADA WANDERKIND TAMBÉM É ANFITRIÃO',
  openDoors: 'PORTAS ABERTAS',
  ways: 'CAMINHOS',
  countries: 'PAÍSES',

  badgeLine1: 'SEGURO',
  badgeLine2: 'Instalação direta',
};

const it: Translations = {
  eyebrow: 'FOND. MMXXVI',
  subtitle: 'Percorri le antiche vie.\nResta con chi le percorre anche.',
  valueTitle: 'Una rete di porte aperte',
  valueBody: (h, c, r) =>
    `${h}+ ospitanti in ${c} paesi accolgono camminatori su ${r} cammini storici. Soggiorni gratuiti, pasti condivisi e vera connessione umana — senza commissioni, senza intermediari.`,
  trustSafe: 'Perfettamente sicuro',
  trustNoStore: 'Nessun app store',
  trustPrivacy: 'I tuoi dati restano tuoi',
  independenceText:
    "Wanderkind è indipendente — non è un prodotto dell'app store, non è una corporation. Per l'esperienza perfetta, installalo direttamente sul tuo telefono. Leggero, istantaneo, gratuito.",
  installBtnIOS: 'AGGIUNGI A SCHERMATA',
  installBtnAndroid: 'INSTALLA WANDERKIND',
  installing: 'INSTALLAZIONE...',
  installNoteIOS: 'Tocca per vedere come — 10 secondi',
  installNoteAndroid: 'Un tocco — nessun app store',
  techNote: "Si installa come app web leggera (<2 MB). Nessun tracciamento, nessuna pubblicità.",

  guideTitle: 'Installa Wanderkind',
  guideSubtitle: '3 passi veloci — 10 secondi',
  guideStep1Title: 'Tocca il pulsante Condividi',
  guideStep1Desc: 'Il quadrato con la freccia verso l\'alto — in basso nel browser',
  guideStep1DescIPad: 'Il quadrato con la freccia verso l\'alto — in alto a destra nel browser',
  guideStep2Title: '"Aggiungi alla schermata Home"',
  guideStep2Desc: '**Scorri verso il basso** nella lista — sotto le prime opzioni. Cerca l\'icona +',
  guideStep3Title: 'Tocca "Aggiungi"',
  guideStep3Desc: 'Wanderkind appare sulla tua schermata — aprilo come qualsiasi app',
  guidePointer: 'Il pulsante Condividi è qui in basso',
  guideNext: 'AVANTI',

  welcomeHome: 'Bentornato a casa, camminatore.',
  beginBtn: 'DIVENTA WANDERKIND',
  signinLink: 'Già Wanderkind',
  hostBanner: 'OGNI WANDERKIND È ANCHE UN OSPITANTE',
  openDoors: 'PORTE APERTE',
  ways: 'CAMMINI',
  countries: 'PAESI',

  badgeLine1: 'SICURO',
  badgeLine2: 'Installazione diretta',
};

const nl: Translations = {
  eyebrow: 'OPGR. MMXXVI',
  subtitle: 'Loop de oude wegen.\nBlijf bij wie ze ook bewandelt.',
  valueTitle: 'Een netwerk van open deuren',
  valueBody: (h, c, r) =>
    `${h}+ gastheren in ${c} landen verwelkomen wandelaars op ${r} historische wandelroutes. Gratis verblijf, gedeelde maaltijden en echte menselijke verbinding — geen boekingskosten, geen tussenpersonen.`,
  trustSafe: 'Helemaal veilig',
  trustNoStore: 'Geen app store',
  trustPrivacy: 'Je data blijft van jou',
  independenceText:
    'Wanderkind is onafhankelijk — geen app store-product, geen bedrijf. Voor de perfecte ervaring installeer je het direct op je telefoon. Licht, direct, gratis.',
  installBtnIOS: 'VOEG TOE AAN BEGINSCHERM',
  installBtnAndroid: 'WANDERKIND INSTALLEREN',
  installing: 'INSTALLEREN...',
  installNoteIOS: 'Tik om te zien hoe — duurt 10 seconden',
  installNoteAndroid: 'Eén tik — geen app store nodig',
  techNote: 'Installeert als lichte web-app (<2 MB). Geen tracking, geen advertenties.',

  guideTitle: 'Wanderkind installeren',
  guideSubtitle: '3 snelle stappen — 10 seconden',
  guideStep1Title: 'Tik op Delen',
  guideStep1Desc: 'Het vierkant met de pijl omhoog — onderaan je browser',
  guideStep1DescIPad: 'Het vierkant met de pijl omhoog — rechtsboven in je browser',
  guideStep2Title: '"Zet op beginscherm"',
  guideStep2Desc: '**Scroll naar beneden** in de lijst — onder de eerste opties. Zoek het + icoon',
  guideStep3Title: 'Tik op "Voeg toe"',
  guideStep3Desc: 'Wanderkind verschijnt op je beginscherm — open het als elke app',
  guidePointer: 'Deelknop is hier beneden',
  guideNext: 'VOLGENDE',

  welcomeHome: 'Welkom thuis, wandelaar.',
  beginBtn: 'WORD EEN WANDERKIND',
  signinLink: 'Al een Wanderkind',
  hostBanner: 'ELKE WANDERKIND IS OOK EEN GASTHEER',
  openDoors: 'OPEN DEUREN',
  ways: 'WEGEN',
  countries: 'LANDEN',

  badgeLine1: 'VEILIG',
  badgeLine2: 'Directe installatie',
};

const translations: Record<LangCode, Translations> = { en, de, es, fr, pt, it, nl };

export function getTranslations(lang: LangCode): Translations {
  return translations[lang] ?? translations.en;
}
