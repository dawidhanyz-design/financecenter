// Dane przykładowe (mock/ilustracyjne) — patrz sekcja "Ustawienia" w apce.
// Ocena fazy cyklu i klas aktywów to materiał edukacyjny oparty na klasycznych
// zależnościach makro, NIE aktualna rekomendacja inwestycyjna.

const CYCLE_PHASES = [
  { id: "early", name: "Wczesny cykl (ożywienie)", angle: [0, 90], color: "#3b82f6" },
  { id: "mid", name: "Środek cyklu (ekspansja)", angle: [90, 180], color: "#16a34a" },
  { id: "late", name: "Późny cykl (szczyt / spowolnienie)", angle: [180, 270], color: "#f59e0b" },
  { id: "recession", name: "Recesja (kontrakcja)", angle: [270, 360], color: "#dc2626" },
];

// Punktacja "wskaźnika cyklu koniunkturalnego" (mock/ilustracyjna): baza 50 pkt (neutralnie)
// + wkład 5 wskaźników makro. Wyższy wynik = gospodarka "gorętsza" / silniejszy wzrost,
// niższy = słabsza, bliżej recesji. Pasma: 0–20 Recesja, 20–45 Późny cykl, 45–70 Środek
// cyklu, 70–100 Wczesny cykl. To metodologia edukacyjna, nie prognoza.
const CYCLE_SCORE_BASE = 50;
const CYCLE_SCORE_BASE_EXPLANATION = "Wynik zaczyna się od poziomu neutralnego 50/100 — punktu, w którym żaden z pięciu wskaźników nie wskazywałby ani na przegrzanie, ani na osłabienie gospodarki. To umowny środek skali 0–100, a nie realny pomiar: od tej bazy odejmujemy lub dodajemy punkty za każdy wskaźnik, zależnie od tego, czy jego aktualny odczyt sprzyja wzrostowi, czy przed nim ostrzega. Dzięki temu zarówno mocno pozytywne, jak i mocno negatywne środowisko makro mają gdzie się zmieścić na skali.";

const CURRENT_CYCLE = {
  phaseId: "late",
  confidence: "Umiarkowana",
  description: "Wzrost gospodarczy zwalnia z wysokiego poziomu, inflacja pozostaje podwyższona ale zaczyna hamować, a polityka banku centralnego jest wciąż restrykcyjna. To typowy obraz późnej fazy cyklu — rynek pracy jest jeszcze mocny, lecz zaczynają pojawiać się pierwsze pęknięcia (spadające PMI, spłaszczona krzywa dochodowości).",
  indicators: [
    {
      label: "Krzywa dochodowości (2Y–10Y)",
      value: "blisko zera / lekko odwrócona",
      trend: "warning",
      points: -6,
      note: "Historycznie jeden z najbardziej wiarygodnych wyprzedzających sygnałów zbliżającego się spowolnienia.",
      explainer: "Różnica między rentownością obligacji skarbowych 10-letnich i 2-letnich. Dodatnia i stroma krzywa = rynek oczekuje zdrowego wzrostu. Gdy spada do zera lub się odwraca (krótkoterminowe rentowności wyższe niż długoterminowe), inwestorzy oczekują spowolnienia lub przyszłych cięć stóp. Punktacja: od +10 (stroma, zdrowa) do -12 (głęboko odwrócona).",
    },
    {
      label: "Inflacja (CPI r/r)",
      value: "powyżej celu, trend spadkowy",
      trend: "down",
      points: -2,
      note: "Presja cenowa słabnie, ale wciąż nie wróciła do celu banku centralnego — lekko negatywny wkład, bo poprawa już w toku.",
      explainer: "Roczna zmiana wskaźnika cen konsumenckich (CPI), oceniana względem celu banku centralnego (zwykle ok. 2%) oraz kierunku zmian. Inflacja powyżej celu obniża wynik, bo ogranicza pole do luzowania polityki; zbliżanie się do celu go podnosi. Punktacja: od +8 (blisko celu, stabilna) do -10 (wysoka i rosnąca).",
    },
    {
      label: "Bezrobocie",
      value: "historycznie niskie, zaczyna rosnąć",
      trend: "up",
      points: -4,
      note: "Rynek pracy zwykle jako jeden z ostatnich wskaźników reaguje na spowolnienie — początek wzrostu to wczesne ostrzeżenie.",
      explainer: "Stopa bezrobocia i jej kierunek względem niedawnych minimów. Rynek pracy reaguje na spowolnienie jako jeden z ostatnich wskaźników, ale gdy już zaczyna się pogarszać, jest to sygnał bardzo wiarygodny. Punktacja: od +8 (spada lub stabilnie nisko) do -12 (wyraźnie rośnie).",
    },
    {
      label: "PMI przemysłowy",
      value: "poniżej 50 pkt (kontrakcja)",
      trend: "down",
      points: -8,
      note: "Sektor przemysłowy sygnalizuje spadek aktywności — klasyczna cecha późnego cyklu, największy pojedynczy wkład do wyniku.",
      explainer: "Purchasing Managers' Index — ankietowy wskaźnik nastrojów wśród menedżerów zakupów w przemyśle, publikowany co miesiąc. Wartość powyżej 50 pkt = ekspansja aktywności, poniżej 50 = kontrakcja. To jeden z najbardziej aktualnych wskaźników koniunktury, dlatego ma największą wagę w tym modelu. Punktacja: od +12 (wyraźnie powyżej 50) do -15 (głęboko poniżej 50).",
    },
    {
      label: "Polityka banku centralnego",
      value: "restrykcyjna, sygnały pierwszych obniżek",
      trend: "neutral",
      points: -3,
      note: "Stopy pozostają wysokie, ale rynek zaczyna wyceniać zbliżający się zwrot w polityce — część negatywnego wpływu już złagodzona.",
      explainer: "Ocena, czy aktualne nastawienie banku centralnego (poziom stóp względem neutralnego, kierunek zmian, komunikacja) sprzyja wzrostowi, czy go hamuje. Polityka restrykcyjna (wysokie stopy, zacieśnianie) obniża wynik, łagodna (cięcia stóp) go podnosi. Punktacja: od +10 (wyraźnie łagodna) do -10 (mocno restrykcyjna).",
    },
  ],
};

CURRENT_CYCLE.score = CYCLE_SCORE_BASE + CURRENT_CYCLE.indicators.reduce((sum, ind) => sum + ind.points, 0);

// "Dane aktualne na" — symulacja codziennej aktualizacji o 8:00. Dane są nadal statyczne/
// ilustracyjne (patrz Ustawienia), ale ta etykieta pokazuje, na jaką godzinę są "ważne" —
// realna integracja podmieniłaby też same liczby o tej porze.
function lastDataRefresh() {
  const now = new Date();
  const refresh = new Date(now);
  refresh.setHours(8, 0, 0, 0);
  if (now < refresh) refresh.setDate(refresh.getDate() - 1);
  return refresh;
}

function formatDataRefresh() {
  const d = lastDataRefresh();
  const dateStr = d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  return `${dateStr}, 08:00`;
}

const CYCLE_SCORE_BANDS = [
  { min: 0, max: 20, label: "Recesja", color: "#dc2626" },
  { min: 20, max: 45, label: "Późny cykl", color: "#f59e0b" },
  { min: 45, max: 70, label: "Środek cyklu", color: "#16a34a" },
  { min: 70, max: 101, label: "Wczesny cykl", color: "#3b82f6" },
];

function cycleScoreBand(score) {
  return CYCLE_SCORE_BANDS.find((b) => score >= b.min && score < b.max) || CYCLE_SCORE_BANDS[0];
}

// Punkty kotwiczące 5-letniej historii wskaźnika (mock/ilustracyjna, ale ułożona tak,
// by opowiadać spójną historię: ożywienie po 2021, boom 2022, potem stopniowe chłodzenie
// wraz z podwyżkami stóp aż do dzisiejszej późnej fazy cyklu).
const CYCLE_SCORE_ANCHORS = [
  { date: "2021-09-17", score: 38 },
  { date: "2022-01-15", score: 55 },
  { date: "2022-06-15", score: 68 },
  { date: "2022-10-15", score: 65 },
  { date: "2023-03-15", score: 58 },
  { date: "2023-09-15", score: 50 },
  { date: "2024-03-15", score: 44 },
  { date: "2024-09-15", score: 40 },
  { date: "2025-03-15", score: 35 },
  { date: "2025-09-15", score: 31 },
  { date: "2026-03-15", score: 29 },
  { date: "2026-09-17", score: CURRENT_CYCLE.score },
];

function getCycleScoreHistory() {
  const rng = mulberry32(hashString("cycle-score-history"));
  const points = [];
  for (let i = 0; i < CYCLE_SCORE_ANCHORS.length - 1; i++) {
    const a = CYCLE_SCORE_ANCHORS[i];
    const b = CYCLE_SCORE_ANCHORS[i + 1];
    const startDate = new Date(a.date);
    const endDate = new Date(b.date);
    const totalDays = (endDate - startDate) / 86400000;
    const steps = Math.max(1, Math.round(totalDays / 30));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const d = new Date(startDate.getTime() + t * (endDate - startDate));
      const base = a.score + (b.score - a.score) * t;
      const noise = (rng() - 0.5) * 3;
      points.push({ date: d.toISOString().slice(0, 10), score: Math.round(Math.max(0, Math.min(100, base + noise))) });
    }
  }
  const last = CYCLE_SCORE_ANCHORS[CYCLE_SCORE_ANCHORS.length - 1];
  points.push({ date: last.date, score: last.score });
  return points;
}

const ASSET_CLASSES = [
  {
    id: "akcje",
    name: "Akcje",
    icon: "▲",
    tagline: "Udział we wzroście gospodarki i zyskach spółek — z rosnącą selektywnością w późnym cyklu.",
    verdict: "Selektywnie / ostrożnie",
    verdictLevel: "warning",
    score: 48,
    scoreBreakdown: [
      { label: "Baza", points: 50 },
      { label: "Dopasowanie do obecnej fazy cyklu (późny cykl)", points: -8 },
      { label: "Trend / moment rynkowy", points: 6 },
    ],
    rationale: "W późnej fazie cyklu akcje potrafią jeszcze rosnąć, ale coraz węższą grupą liderów — to wzorzec znany z 1999–2000, 2007 i 2018–2019. Spadające PMI i spłaszczająca się krzywa dochodowości historycznie poprzedzały korekty z wyprzedzeniem 6–18 miesięcy, więc ryzyko pogorszenia wycen rośnie. Jednocześnie rynek pracy jest wciąż mocny, a zyski spółek nie załamały się, co nie uzasadnia całkowitego wycofania się z akcji. Dlatego rekomendacja to selektywność: przewaga spółek jakościowych, defensywnych i rozsądnie wycenionych nad wysoko wycenionym wzrostem, oraz akceptacja wyższej zmienności.",
    phaseTable: {
      early: "Silne — zwykle najlepsza faza dla akcji",
      mid: "Dobre — szeroki, stabilny wzrost",
      late: "Selektywne — jakość i wartość górują nad wzrostem",
      recession: "Słabe — presja na zyski i wyceny",
    },
    yearByYear: {
      range: "2006–2012 (pełen cykl: szczyt hossy → kryzys finansowy → odbudowa)",
      years: [
        { year: 2006, note: "Rynek rośnie, gospodarka silna, ceny nieruchomości na szczycie." },
        { year: 2007, note: "Szczyt hossy (październik), pierwsze pęknięcia na rynku kredytów subprime." },
        { year: 2008, note: "Krach — główne indeksy spadają o 35–50%, upadek Lehman Brothers." },
        { year: 2009, note: "Dołek w marcu, potem gwałtowne odbicie napędzane luzowaniem Fed." },
        { year: 2010, note: "Kontynuacja odbicia, ale nerwowo — kryzys zadłużenia w Europie." },
        { year: 2011, note: "Wysoka zmienność, obniżka ratingu USA, spadki w sierpniu." },
        { year: 2012, note: "Stabilny wzrost, rynek odzyskuje przedkryzysowe szczyty." },
      ],
    },
    analogs: [
      { period: "1999–2000 (szczyt dot-com)", text: "Rynek rósł napędzany wąską grupą spółek technologicznych przy rozciągniętych wycenach. Po szczycie nastąpiła wieloletnia, głęboka korekta w segmencie wzrostowym." },
      { period: "2018–2019", text: "Fed podnosił stopy, wzrost gospodarczy zwalniał, a rynek pozostawał we wzrostowym trendzie, ale z wyraźnie większą zmiennością i okresowymi głębokimi korektami." },
    ],
    pros: [
      "Udział w długoterminowym wzroście gospodarki i zysków firm",
      "Wysoka płynność większości rynków",
      "Możliwość uzyskania dochodu z dywidend",
      "Historycznie najlepsza klasa aktywów chroniąca przed inflacją w długim terminie",
    ],
    cons: [
      "Wysoka zmienność, szczególnie w późnym cyklu",
      "Ryzyko istotnej korekty przy pogorszeniu danych makro",
      "Wyceny mogą być rozciągnięte względem fundamentów",
      "Wrażliwość na zmiany stóp procentowych",
    ],
  },
  {
    id: "obligacje",
    name: "Obligacje",
    icon: "▬",
    tagline: "Stabilny dochód odsetkowy i naturalna przeciwwaga dla akcji — zyskują na atrakcyjności pod koniec cyklu.",
    verdict: "Warto rozważyć (budowa pozycji)",
    verdictLevel: "positive",
    score: 74,
    scoreBreakdown: [
      { label: "Baza", points: 50 },
      { label: "Dopasowanie do obecnej fazy cyklu (późny cykl)", points: 18 },
      { label: "Trend / moment rynkowy", points: 6 },
    ],
    rationale: "Rentowności obligacji są dziś relatywnie atrakcyjne po serii podwyżek stóp, a historycznie właśnie w późnej fazie cyklu — tuż przed pierwszymi cięciami stóp — obligacje zaczynają zyskiwać na wartości (2000–2001, 2007). Restrykcyjna wciąż polityka banku centralnego oznacza, że nowe zakupy „łapią” wysoki kupon, a każde potwierdzenie spowolnienia (spadające PMI, rosnące bezrobocie) zwiększa prawdopodobieństwo obniżek stóp — co podnosi ceny już posiadanych obligacji. To klasyczny moment na stopniowe budowanie pozycji o dłuższym duration, choć ryzyko krótkoterminowej zmienności rentowności pozostaje.",
    phaseTable: {
      early: "Neutralne — stopy zwykle jeszcze niskie, ale mogą zacząć rosnąć",
      mid: "Neutralne — rentowności rosną wraz z ekspansją",
      late: "Dobre — atrakcyjne rentowności, budowanie pozycji przed cięciami stóp",
      recession: "Silne — ceny rosną, gdy bank centralny tnie stopy",
    },
    yearByYear: {
      range: "2006–2012 (pełen cykl: podwyżki stóp → kryzys → luzowanie)",
      years: [
        { year: 2006, note: "Rentowności rosną wraz z podwyżkami stóp Fed." },
        { year: 2007, note: "Rentowności zaczynają spadać — rynek wyczuwa nadchodzące spowolnienie." },
        { year: 2008, note: "Gwałtowny rajd obligacji skarbowych — klasyczna „ucieczka do bezpieczeństwa”." },
        { year: 2009, note: "Rentowności przy historycznych minimach, potem lekkie odbicie." },
        { year: 2010, note: "Stabilnie, program QE1 wspiera ceny obligacji." },
        { year: 2011, note: "Kolejny rajd na fali kryzysu w Europie, rentowność 10-letnich obligacji USA spada poniżej 2%." },
        { year: 2012, note: "Rentowności przy rekordowych minimach, ogłoszenie programu QE3." },
      ],
    },
    analogs: [
      { period: "2000–2001", text: "Obligacje skarbowe wyraźnie zyskiwały, gdy Fed rozpoczął cykl obniżek stóp po pęknięciu bańki internetowej." },
    ],
    pros: [
      "Przewidywalny dochód odsetkowy",
      "Potencjał zysków kapitałowych, gdy stopy zaczynają spadać",
      "Skuteczna dywersyfikacja względem akcji, zwłaszcza w recesji",
      "Niższa zmienność niż w przypadku akcji",
    ],
    cons: [
      "Ryzyko stopy procentowej — ceny spadają, gdy rentowności rosną",
      "Ryzyko kredytowe w przypadku obligacji korporacyjnych",
      "Realna strata siły nabywczej przy wysokiej inflacji",
      "Niższy potencjał zwrotu niż akcje w długim terminie",
    ],
  },
  {
    id: "waluty",
    name: "System monetarny i waluty",
    icon: "$",
    tagline: "Polityka banków centralnych i przepływy kapitału decydują o sile walut — kluczowy wskaźnik wyprzedzający dla innych klas aktywów.",
    verdict: "Obserwuj rozbieżności polityk banków centralnych",
    verdictLevel: "neutral",
    score: 55,
    scoreBreakdown: [
      { label: "Baza", points: 50 },
      { label: "Dopasowanie do obecnej fazy cyklu (późny cykl)", points: 3 },
      { label: "Trend / moment rynkowy", points: 2 },
    ],
    rationale: "W późnym cyklu waluta kraju, który jako pierwszy zacznie luzować politykę, zwykle traci względem walut, których banki centralne pozostają bardziej restrykcyjne — kluczowe jest więc śledzenie tempa i kolejności cięć stóp między głównymi gospodarkami. Historia (2000–2001, 2007–2008) pokazuje, że dolar potrafi pozostać silny aż do samego szczytu cyklu, a potem gwałtownie zmienić kierunek, gdy zaczynają się obniżki. Brak jednoznacznego sygnału w żadną stronę na obecnym etapie uzasadnia postawę obserwacyjną, a nie aktywne pozycjonowanie walutowe.",
    phaseTable: {
      early: "Waluty ryzykowne (surowcowe, rynków wschodzących) zwykle zyskują",
      mid: "Względnie stabilnie, zależnie od tempa zacieśniania polityki",
      late: "Rozbieżności polityk banków centralnych, waluta rezerwowa często silna",
      recession: "Waluty bezpieczne (USD, CHF, JPY) zwykle zyskują najbardziej",
    },
    yearByYear: {
      range: "2006–2012 (dolar w pełnym cyklu koniunkturalnym)",
      years: [
        { year: 2006, note: "Dolar słaby, kapitał płynie na rynki wschodzące w poszukiwaniu wzrostu." },
        { year: 2007, note: "Dalsze osłabienie USD, Fed zaczyna ciąć stopy procentowe." },
        { year: 2008, note: "Gwałtowne umocnienie USD w szczycie paniki — rola bezpiecznej przystani." },
        { year: 2009, note: "USD słabnie, gdy panika mija i kapitał wraca do aktywów ryzykownych." },
        { year: 2010, note: "Kryzys zadłużenia w Europie ponownie wzmacnia USD względem EUR." },
        { year: 2011, note: "Wysoka zmienność walutowa, EUR pod presją kryzysu zadłużenia." },
        { year: 2012, note: "EBC („whatever it takes” Draghiego) stabilizuje EUR." },
      ],
    },
    analogs: [
      { period: "2000–2001", text: "Dolar amerykański pozostawał silny aż do szczytu cyklu, po czym osłabł wraz z obniżkami stóp w reakcji na spowolnienie." },
    ],
    pros: [
      "Waluty defensywne mogą chronić kapitał w okresach niepewności",
      "Dywersyfikacja geograficzna i walutowa portfela",
      "Polityka banków centralnych daje wyprzedzające sygnały dla innych klas aktywów",
      "Wysoka płynność rynku walutowego",
    ],
    cons: [
      "Bardzo trudne do przewidzenia w krótkim terminie",
      "Interwencje banków centralnych mogą zniekształcać rynek",
      "Zerowe lub ujemne oprocentowanie części walut",
      "Istotny wpływ czynników geopolitycznych",
    ],
  },
  {
    id: "metale",
    name: "Metale szlachetne",
    icon: "◆",
    tagline: "Klasyczne zabezpieczenie przed niepewnością i spadkiem realnych stóp procentowych.",
    verdict: "Warto rozważyć jako zabezpieczenie",
    verdictLevel: "positive",
    score: 71,
    scoreBreakdown: [
      { label: "Baza", points: 50 },
      { label: "Dopasowanie do obecnej fazy cyklu (późny cykl)", points: 15 },
      { label: "Trend / moment rynkowy", points: 6 },
    ],
    rationale: "Złoto i inne metale szlachetne historycznie zyskiwały, gdy realne stopy procentowe zaczynały spadać, a niepewność co do dalszego przebiegu cyklu rosła — dokładnie jak teraz. Sygnały pierwszych obniżek stóp i rosnące ryzyko spowolnienia zwiększają atrakcyjność metali jako aktywa nisko skorelowanego z akcjami. Dodatkowo metale szlachetne dobrze radziły sobie zarówno w końcówce poprzednich cykli (2007–2012), jak i w samej recesji, co czyni je jednym z niewielu aktywów „dobrych na obie strony” obecnej fazy.",
    phaseTable: {
      early: "Neutralne / słabsze — kapitał wraca do aktywów ryzykownych",
      mid: "Neutralne",
      late: "Dobre — rośnie popyt na zabezpieczenie",
      recession: "Silne — spadek realnych stóp i ucieczka do bezpiecznych aktywów",
    },
    yearByYear: {
      range: "2006–2012 (złoto w trakcie i po kryzysie finansowym)",
      years: [
        { year: 2006, note: "Złoto rośnie wraz z osłabieniem dolara." },
        { year: 2007, note: "Kontynuacja wzrostów, narastający niepokój o rynek kredytowy." },
        { year: 2008, note: "Początkowo spadek — panika wymusza sprzedaż wszystkiego dla płynności, potem odbicie." },
        { year: 2009, note: "Silny wzrost — luzowanie ilościowe (QE) i obawy o dług napędzają popyt." },
        { year: 2010, note: "Kontynuacja hossy, kolejne rekordy cenowe." },
        { year: 2011, note: "Szczyt ok. 1900 USD/uncję (sierpień), potem korekta." },
        { year: 2012, note: "Konsolidacja na wysokich poziomach cenowych." },
      ],
    },
    analogs: [
      { period: "2000–2001", text: "Po pęknięciu bańki dot-com złoto rozpoczęło wieloletnią hossę trwającą przez większość dekady." },
    ],
    pros: [
      "Tradycyjne zabezpieczenie przed inflacją i niepewnością",
      "Niska lub ujemna korelacja z akcjami w okresach kryzysowych",
      "Ograniczona podaż fizyczna",
      "Globalnie uznawany przechowalnik wartości",
    ],
    cons: [
      "Brak bieżącego dochodu (odsetek, dywidendy)",
      "Możliwa wysoka zmienność w krótkim terminie",
      "Koszty przechowywania przy fizycznym metalu",
      "Słabsze zachowanie w okresach silnego wzrostu i wysokich realnych stóp",
    ],
  },
  {
    id: "surowce",
    name: "Surowce",
    icon: "●",
    tagline: "Bezpośrednia ekspozycja na globalny popyt i podaż — zwykle szczyt osiągają najpóźniej w cyklu.",
    verdict: "Mieszanie / selektywnie",
    verdictLevel: "warning",
    score: 44,
    scoreBreakdown: [
      { label: "Baza", points: 50 },
      { label: "Dopasowanie do obecnej fazy cyklu (późny cykl)", points: -10 },
      { label: "Trend / moment rynkowy", points: 4 },
    ],
    rationale: "Surowce zwykle osiągają szczyt cen najpóźniej w cyklu — popyt przemysłowy jest jeszcze wysoki, ale zaczyna hamować wraz ze spadkiem PMI poniżej 50. Historia 2008 i 2022 pokazuje, że po takim szczycie potrafi nastąpić gwałtowna korekta, gdy spowolnienie zaczyna realnie ograniczać popyt. Uzasadnia to mieszaną, selektywną ocenę: część surowców (np. związanych z inwestycjami infrastrukturalnymi) może się jeszcze trzymać dobrze, ale ryzyko nagłego odwrócenia trendu jest podwyższone.",
    phaseTable: {
      early: "Odbicie od dołka cyklu",
      mid: "Silne — rosnący popyt przemysłowy",
      late: "Szczyt cenowy, wysoka zmienność",
      recession: "Słabe — załamanie popytu",
    },
    yearByYear: {
      range: "2006–2012 (surowce: boom, szczyt, załamanie, odbudowa)",
      years: [
        { year: 2006, note: "Wysokie ceny energii, silny globalny popyt przemysłowy." },
        { year: 2007, note: "Dalszy wzrost cen ropy i surowców przemysłowych." },
        { year: 2008, note: "Ropa naftowa osiąga szczyt ok. 147 USD/baryłkę (lipiec), potem załamanie do ok. 35 USD (grudzień)." },
        { year: 2009, note: "Dołek na początku roku, potem stopniowe odbicie wraz z ożywieniem gospodarczym." },
        { year: 2010, note: "Wzrost napędzany rosnącym popytem z Chin." },
        { year: 2011, note: "Kontynuacja hossy surowcowej, szczyty cen wielu surowców." },
        { year: 2012, note: "Stabilizacja — spowolnienie wzrostu w Chinach zaczyna ciążyć cenom." },
      ],
    },
    analogs: [
      { period: "2021–2022", text: "Silny wzrost cen surowców w warunkach wysokiej inflacji, a następnie wyraźna korekta wraz ze spowolnieniem globalnego popytu." },
    ],
    pros: [
      "Naturalna ochrona przed inflacją",
      "Dywersyfikacja — niska korelacja z akcjami i obligacjami",
      "Bezpośrednia ekspozycja na realną gospodarkę",
    ],
    cons: [
      "Bardzo wysoka zmienność cen",
      "Brak bieżącego dochodu",
      "Silna wrażliwość na spowolnienie gospodarcze",
      "Ryzyko geopolityczne i pogodowe (surowce rolne)",
    ],
  },
  {
    id: "nieruchomosci",
    name: "Nieruchomości i REIT-y",
    icon: "▦",
    tagline: "Dochód z czynszów i ekspozycja na rynek nieruchomości — silnie wrażliwe na poziom stóp procentowych.",
    verdict: "Zachować ostrożność",
    verdictLevel: "negative",
    score: 33,
    scoreBreakdown: [
      { label: "Baza", points: 50 },
      { label: "Dopasowanie do obecnej fazy cyklu (późny cykl)", points: -20 },
      { label: "Trend / moment rynkowy", points: 3 },
    ],
    rationale: "Nieruchomości i REIT-y są jedną z klas aktywów najbardziej wrażliwych na poziom stóp procentowych, a te pozostają restrykcyjne, co podnosi koszty finansowania i obniża atrakcyjność nowych inwestycji. Historia 2006–2008 pokazuje najbardziej dotkliwy scenariusz — szczyt boomu mieszkaniowego tuż przed późną fazą cyklu, po którym nastąpił głęboki krach napędzający globalny kryzys finansowy. Rosnące bezrobocie i słabnący PMI to dodatkowe sygnały ryzyka dla popytu na powierzchnię komercyjną i mieszkaniową, stąd zalecana ostrożność mimo kuszącego dochodu z czynszów.",
    phaseTable: {
      early: "Stabilizacja i powolne odbicie",
      mid: "Silne — rosnący popyt i czynsze",
      late: "Słabnące — rosnące koszty finansowania",
      recession: "Słabe — spadek popytu i wycen",
    },
    yearByYear: {
      range: "2006–2012 (nieruchomości: szczyt boomu, krach, odbudowa)",
      years: [
        { year: 2006, note: "Szczyt boomu mieszkaniowego w USA." },
        { year: 2007, note: "Pierwsze pęknięcia — rosnąca liczba niespłacanych kredytów subprime." },
        { year: 2008, note: "Załamanie rynku nieruchomości, REIT-y spadają o ponad 50%." },
        { year: 2009, note: "Dalsze spadki na początku roku, potem dołek i stabilizacja." },
        { year: 2010, note: "Powolna odbudowa, ale rynek mieszkaniowy wciąż słaby." },
        { year: 2011, note: "REIT-y odbijają szybciej niż rynek nieruchomości fizycznych." },
        { year: 2012, note: "Kontynuacja odbudowy, niskie stopy procentowe wspierają wyceny." },
      ],
    },
    analogs: [
      { period: "2018–2019", text: "REIT-y znalazły się pod presją rosnących stóp procentowych, a następnie wyraźnie odbiły, gdy bank centralny zasygnalizował zwrot w polityce monetarnej." },
    ],
    pros: [
      "Regularny dochód z czynszów / dywidend REIT",
      "Potencjalna ochrona przed inflacją poprzez rosnące czynsze",
      "Dywersyfikacja portfela o aktywo namacalne",
    ],
    cons: [
      "Bardzo wysoka wrażliwość na zmiany stóp procentowych",
      "Niska płynność w przypadku nieruchomości bezpośrednich",
      "Ryzyko lokalnego rynku i popytu",
      "REIT-y mogą silnie korelować z akcjami w kryzysach płynnościowych",
    ],
  },
];

// Katalog instrumentów (mock/ilustracyjny) — ceny bazowe wyrażone w PLN.
// Pełne dane (zmiana dnia, otwarcie, min/max, 52-tyg.) generowane deterministycznie
// z tickera, żeby nie trzeba było ręcznie wpisywać ich dla dziesiątek instrumentów.
const MARKET_SEED = [
  // Akcje
  { ticker: "AAPL", name: "Apple Inc.", assetClass: "akcje", price: 815.50, cap: "3.1 bln USD" },
  { ticker: "MSFT", name: "Microsoft Corp.", assetClass: "akcje", price: 1610.75, cap: "2.9 bln USD" },
  { ticker: "GOOGL", name: "Alphabet Inc. (Google)", assetClass: "akcje", price: 770.25, cap: "2.4 bln USD" },
  { ticker: "AMZN", name: "Amazon.com Inc.", assetClass: "akcje", price: 869.00, cap: "2.3 bln USD" },
  { ticker: "NVDA", name: "NVIDIA Corp.", assetClass: "akcje", price: 730.75, cap: "4.5 bln USD" },
  { ticker: "TSLA", name: "Tesla Inc.", assetClass: "akcje", price: 1343.00, cap: "1.1 bln USD" },
  { ticker: "META", name: "Meta Platforms Inc.", assetClass: "akcje", price: 2409.50, cap: "1.5 bln USD" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", assetClass: "akcje", price: 967.75, cap: "700 mld USD" },
  { ticker: "CDR.WA", name: "CD Projekt", assetClass: "akcje", price: 112.40, cap: "13.9 mld PLN" },
  { ticker: "PKN.WA", name: "PKN Orlen", assetClass: "akcje", price: 58.30, cap: "48.6 mld PLN" },
  { ticker: "ALE.WA", name: "Allegro.eu", assetClass: "akcje", price: 29.95, cap: "20.2 mld PLN" },
  { ticker: "KGH.WA", name: "KGHM Polska Miedź", assetClass: "akcje", price: 145.00, cap: "28.9 mld PLN" },
  { ticker: "PZU.WA", name: "PZU", assetClass: "akcje", price: 48.50, cap: "41.2 mld PLN" },
  { ticker: "PEO.WA", name: "Bank Pekao", assetClass: "akcje", price: 185.00, cap: "48.5 mld PLN" },
  { ticker: "DNP.WA", name: "Dino Polska", assetClass: "akcje", price: 420.00, cap: "38.7 mld PLN" },
  { ticker: "LPP.WA", name: "LPP", assetClass: "akcje", price: 18500.00, cap: "34.1 mld PLN" },

  // Indeksy
  { ticker: "^GSPC", name: "S&P 500", assetClass: "indeks", price: 6450.20 },
  { ticker: "^NDX", name: "Nasdaq 100", assetClass: "indeks", price: 22800.50 },
  { ticker: "^DJI", name: "Dow Jones Industrial Average", assetClass: "indeks", price: 41250.00 },
  { ticker: "WIG20.WA", name: "WIG20", assetClass: "indeks", price: 2680.40 },
  { ticker: "^GDAXI", name: "DAX", assetClass: "indeks", price: 19200.30 },
  { ticker: "^FTSE", name: "FTSE 100", assetClass: "indeks", price: 8200.00 },
  { ticker: "^N225", name: "Nikkei 225", assetClass: "indeks", price: 39500.00 },
  { ticker: "^HSI", name: "Hang Seng", assetClass: "indeks", price: 20500.00 },
  { ticker: "^FCHI", name: "CAC 40", assetClass: "indeks", price: 7650.00 },
  { ticker: "^STOXX50E", name: "Euro Stoxx 50", assetClass: "indeks", price: 5150.00 },

  // ETF-y
  { ticker: "VWRA.L", name: "Vanguard FTSE All-World UCITS ETF (Acc)", assetClass: "etf", price: 486.20 },
  { ticker: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF (Acc) — Xetra", assetClass: "etf", price: 458.90 },
  { ticker: "VUSA.L", name: "Vanguard S&P 500 UCITS ETF (Dist)", assetClass: "etf", price: 342.75 },
  { ticker: "VUAA.L", name: "Vanguard S&P 500 UCITS ETF (Acc)", assetClass: "etf", price: 645.20 },
  { ticker: "VUAA.DE", name: "Vanguard S&P 500 UCITS ETF (Acc) — Xetra", assetClass: "etf", price: 645.20 },
  { ticker: "CSPX.L", name: "iShares Core S&P 500 UCITS ETF (Acc)", assetClass: "etf", price: 2251.00 },
  { ticker: "SXR8.DE", name: "iShares Core S&P 500 UCITS ETF (Acc) — Xetra", assetClass: "etf", price: 2251.00 },
  { ticker: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF (Acc)", assetClass: "etf", price: 415.30 },
  { ticker: "EUNL.DE", name: "iShares Core MSCI World UCITS ETF (Acc) — Xetra", assetClass: "etf", price: 415.30 },
  { ticker: "EIMI.L", name: "iShares Core MSCI EM IMI UCITS ETF", assetClass: "etf", price: 128.40 },
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", assetClass: "etf", price: 2547.75 },
  { ticker: "QQQ", name: "Invesco QQQ Trust (Nasdaq 100)", assetClass: "etf", price: 2212.00 },
  { ticker: "GLD", name: "SPDR Gold Shares", assetClass: "etf", price: 967.75 },
  { ticker: "ARKK", name: "ARK Innovation ETF", assetClass: "etf", price: 229.10 },

  // Metale szlachetne / przemysłowe (kontrakty terminowe)
  { ticker: "GC=F", name: "Złoto (futures)", assetClass: "metale", price: 8950.00 },
  { ticker: "SI=F", name: "Srebro (futures)", assetClass: "metale", price: 126.40 },
  { ticker: "PL=F", name: "Platyna (futures)", assetClass: "metale", price: 3871.00 },
  { ticker: "HG=F", name: "Miedź (futures)", assetClass: "metale", price: 16.59 },

  // Surowce (kontrakty terminowe)
  { ticker: "CL=F", name: "Ropa WTI (futures)", assetClass: "surowce", price: 312.40 },
  { ticker: "NG=F", name: "Gaz ziemny (futures)", assetClass: "surowce", price: 12.25 },
  { ticker: "ZW=F", name: "Pszenica (futures)", assetClass: "surowce", price: 22.91 },
  { ticker: "ZC=F", name: "Kukurydza (futures)", assetClass: "surowce", price: 16.99 },
  { ticker: "KC=F", name: "Kawa (futures)", assetClass: "surowce", price: 9.28 },

  // Kryptowaluty
  { ticker: "BTC-USD", name: "Bitcoin", assetClass: "krypto", price: 426600.00, cap: "2.1 bln USD" },
  { ticker: "ETH-USD", name: "Ethereum", assetClass: "krypto", price: 16590.00, cap: "505 mld USD" },
  { ticker: "SOL-USD", name: "Solana", assetClass: "krypto", price: 829.50, cap: "112 mld USD" },
  { ticker: "XRP-USD", name: "XRP", assetClass: "krypto", price: 11.06, cap: "160 mld USD" },
  { ticker: "ADA-USD", name: "Cardano", assetClass: "krypto", price: 3.75, cap: "34 mld USD" },
  { ticker: "DOGE-USD", name: "Dogecoin", assetClass: "krypto", price: 1.38, cap: "51 mld USD" },
  { ticker: "BNB-USD", name: "BNB (Binance Coin)", assetClass: "krypto", price: 3871.00, cap: "136 mld USD" },

  // REIT-y
  { ticker: "O", name: "Realty Income Corp.", assetClass: "reit", price: 229.10, cap: "50 mld USD" },
  { ticker: "SPG", name: "Simon Property Group", assetClass: "reit", price: 679.40, cap: "63 mld USD" },
  { ticker: "PLD", name: "Prologis Inc.", assetClass: "reit", price: 466.10, cap: "110 mld USD" },
  { ticker: "PSA", name: "Public Storage", assetClass: "reit", price: 1224.50, cap: "54 mld USD" },
  { ticker: "AVB", name: "AvalonBay Communities", assetClass: "reit", price: 809.75, cap: "29 mld USD" },
  { ticker: "EQIX", name: "Equinix Inc.", assetClass: "reit", price: 3515.50, cap: "85 mld USD" },

  // Kontrakty terminowe finansowe
  { ticker: "ES=F", name: "S&P 500 (kontrakt terminowy)", assetClass: "kontrakt", price: 25497.25 },
  { ticker: "NQ=F", name: "Nasdaq 100 (kontrakt terminowy)", assetClass: "kontrakt", price: 90257.50 },
  { ticker: "YM=F", name: "Dow Jones (kontrakt terminowy)", assetClass: "kontrakt", price: 163135.00 },
  { ticker: "ZB=F", name: "Obligacje skarbowe USA 30L (kontrakt terminowy)", assetClass: "kontrakt", price: 466.10 },
];

function deriveMarketStats(ticker, price) {
  const rng = mulberry32(hashString(`${ticker}:stats`));
  const changePct = (rng() - 0.5) * 4;
  const open = price * (1 - changePct / 100 + (rng() - 0.5) * 0.015);
  const high = Math.max(open, price) * (1 + rng() * 0.01);
  const low = Math.min(open, price) * (1 - rng() * 0.01);
  const w52h = price * (1.15 + rng() * 0.15);
  const w52l = price * (0.85 - rng() * 0.2);
  return { changePct, open, high, low, w52h, w52l };
}

const MARKET_MOCK = {};
MARKET_SEED.forEach(({ ticker, name, assetClass, price, cap }) => {
  MARKET_MOCK[ticker] = { name, assetClass, price, cap: cap || "—", ...deriveMarketStats(ticker, price) };
});

const ASSET_CLASS_LABELS = {
  akcje: "Akcja",
  indeks: "Indeks",
  metale: "Metal",
  surowce: "Surowiec",
  etf: "ETF",
  krypto: "Kryptowaluta",
  reit: "REIT",
  kontrakt: "Kontrakt terminowy",
};

// Kursy walut — ile PLN kosztuje 1 jednostka danej waluty (mock/ilustracyjne).
// Waluty spoza PLN/USD/EUR służą jako "pivot" do przeliczenia notowań z zagranicznych
// giełd (np. GBP z Londynu, JPY z Tokio) na walutę wybraną w przełączniku.
const FX_RATES_PLN = {
  PLN: 1, USD: 3.95, EUR: 4.30, GBP: 5.02, JPY: 0.026,
  HKD: 0.51, CHF: 4.55, CAD: 2.85, AUD: 2.55, CNY: 0.55,
};
const CURRENCY_LOCALES = { PLN: "pl-PL", USD: "en-US", EUR: "de-DE" };

// Wyszukiwarka instrumentów — dopasowanie po tickerze lub nazwie (jak podpowiedzi w sklepie internetowym)
function searchInstruments(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.entries(MARKET_MOCK)
    .filter(([ticker, m]) => ticker.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a[0].toLowerCase().startsWith(q) || a[1].name.toLowerCase().startsWith(q);
      const bStarts = b[0].toLowerCase().startsWith(q) || b[1].name.toLowerCase().startsWith(q);
      return aStarts === bStarts ? 0 : aStarts ? -1 : 1;
    })
    .slice(0, 8)
    .map(([ticker, m]) => ({ ticker, ...m }));
}

// ---- Historia cen (mock, 5 lat) — deterministyczna na podstawie tickera, żeby wykres był stabilny między odświeżeniami ----
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRICE_HISTORY_DAYS = 365 * 5;
const priceHistoryCache = {};

// Zwraca historię cen jako rosnącą tablicę {date: "RRRR-MM-DD", close: number} —
// dokładnie ten sam kształt co dane historyczne z Twelve Data (patrz js/live-data.js),
// żeby dalszy kod (wykresy, zmiany %) nie musiał wiedzieć, skąd pochodzą dane.
function getPriceHistory(ticker) {
  if (priceHistoryCache[ticker]) return priceHistoryCache[ticker];
  const meta = MARKET_MOCK[ticker];
  const currentPrice = meta ? meta.price : 100;
  const rng = mulberry32(hashString(ticker));
  const dailyDrift = 0.00035;
  const closes = [currentPrice * 0.5];
  for (let i = 1; i < PRICE_HISTORY_DAYS; i++) {
    const vol = (rng() - 0.5) * 0.024;
    closes.push(Math.max(closes[i - 1] * (1 + dailyDrift + vol), 0.01));
  }
  const scale = currentPrice / closes[closes.length - 1];
  const today = new Date();
  const series = closes.map((c, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (PRICE_HISTORY_DAYS - 1 - i));
    return { date: d.toISOString().slice(0, 10), close: c * scale };
  });
  priceHistoryCache[ticker] = series;
  return series;
}

// series: rosnąca tablica {date, close}. Znajduje najbliższą sesję sprzed `daysAgo` dni
// (radzi sobie z lukami po weekendach/świętach w danych live, gdzie nie ma sesji co dzień).
function pctChangeOverDays(series, daysAgo) {
  if (!series || series.length < 2) return null;
  const current = series[series.length - 1].close;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  const targetStr = targetDate.toISOString().slice(0, 10);
  let past = series[0].close;
  for (let i = 0; i < series.length; i++) {
    if (series[i].date <= targetStr) past = series[i].close;
    else break;
  }
  if (!past) return null;
  return ((current - past) / past) * 100;
}

function pctChange5y(series) {
  if (!series || series.length < 2) return null;
  const first = series[0].close;
  const last = series[series.length - 1].close;
  if (!first) return null;
  return ((last - first) / first) * 100;
}

function downsampleWeekly(series) {
  const out = [];
  for (let i = 0; i < series.length; i += 7) out.push(series[i]);
  const last = series[series.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

function formatMonthYear(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });
}
