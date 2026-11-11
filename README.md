# The Hangman Game

Responzivní implementace [Frontend Mentor Hangman challenge](https://www.frontendmentor.io) v HTML, CSS a modulárním JavaScriptu. Mobile first, bez frameworku a bez produkčních závislostí. Původní zadání je v [docs/CHALLENGE.md](./docs/CHALLENGE.md).

## Spuštění

Potřebuješ Node.js 20 nebo novější (doporučeno aktuální LTS).

```sh
npm install
npm run dev
```

Otevři **http://127.0.0.1:5173**. Samotná aplikace i vývojový server fungují bez instalace balíčků; dev dependencies slouží pouze pro automatické testy. Použij HTTP server, protože aplikace načítá ES moduly a lokální JSON přes `fetch`.

```sh
npm run build    # vytvoří statický web v dist/
npm run preview  # spustí dist/ na stejném portu
```

Obsah `dist/` lze nasadit na GitHub Pages, Netlify nebo jiný statický hosting. Cesty k assetům jsou relativní, takže funguje i nasazení do podadresáře. Projekt zatím nebyl publikován.

## Funkce a ovládání

- Hlavní menu, pravidla a šest kategorií se 180 názvy z dodaného `data.json`.
- Náhodný výběr bez opakování během návštěvy, i po přepnutí kategorie nebo návratu do menu.
- Správný tip odhalí všechny výskyty písmene. Osm různých chybných tipů znamená prohru.
- Výhra a prohra nabídnou další kolo, změnu kategorie nebo návrat do menu.
- Vyčerpaná kategorie se deaktivuje; slovník se obnoví až při nové návštěvě/obnovení stránky.
- Myš, dotyk, Tab / Shift+Tab, Enter / mezerník a přímé psaní A–Z. Esc pozastaví hru a z pauzy pokračuje.
- V pauze se tipy nepřijímají. Opakované tipy, držené klávesy a kombinace s Ctrl / Cmd / Alt se nezapočítávají.
- Chybu načtení slov lze napravit tlačítkem Try again.

Rozhraní je v angličtině podle designu i dodaného slovníku.

## Architektura

```text
starter-code/
  index.html       sémantické obrazovky a nativní dialog
  styles.css       mobile-first styly, breakpointy 600 a 1100 px
  data.json        původní slovník, beze změn
  js/game.js       čisté přechody stavu, výběr slov, popis hádanky
  js/app.js        DOM, načtení dat, focus a ovládání
  assets/          původní SVG a lokální font Mouse Memoirs
scripts/
  serve.mjs        lokální HTTP server
  build.mjs        vytvoření statického distribučního adresáře
tests/
  unit/            testy herních pravidel pomocí node:test
  e2e/             Playwright scénáře a axe-core audit
```

`guessLetter` nemění vstupní stav. Výběr slov drží historii v paměti a nemění dodané JSON objekty. Stav se neukládá na server ani do localStorage. Záměrně se nepoužívá framework, router ani globální store: čtyři obrazovky a jedna hra je nepotřebují.

Celá slova se zalamují jako skupiny. Container query jednotky omezují šířku políček u dlouhého jednotlivého slova. Mobil, tablet a desktop využívají příslušné dodané pozadí. Font je hostovaný lokálně a přednačtený.

## Přístupnost

- Skrytá obrazovka není v pořadí focusu; po navigaci se focus přesouvá na nadpis, po návratu na Play.
- Nativní `dialog.showModal()` znepřístupní pozadí. Tab oběma směry zůstává uvnitř dialogu a po pokračování se focus vrací na Pause.
- `aria-disabled` zachová focus na právě použitém písmenu. Obsluha událostí opakovaný tip ignoruje.
- Životy jsou dostupné jako pojmenovaný `meter`. Trvalý živý region oznamuje tipy, zbývající životy a průběžný stav slov bez prozrazení odpovědi.
- Dekorativní obrázky a vizuální políčka jsou skryté před čtečkou. Hádanka má samostatný textový popis.
- Viditelný focus, skip link, kontrastní ovládání a respektování `prefers-reduced-motion`.

Automatický audit nepokrývá všechny problémy přístupnosti. Ruční test s NVDA / VoiceOver je vhodný před odevzdáním.

## Testy

```sh
npm test
npm run test:e2e
npm run test:all
```

E2E testy ve výchozím nastavení použijí nainstalovaný Google Chrome v headless režimu. Jiný kanál nastavíš pomocí `PLAYWRIGHT_CHANNEL`, například `msedge` nebo `chromium` (ten vyžaduje `npx playwright install chromium`).

Testy běží v rozměrech **375 × 812**, **768 × 1024** a **1440 × 1024**; doplňkově kontrolují osm šířek od 320 do 1100 px. Pokrývají průchod klávesnicí, shodná písmena, opakované tipy, osm chyb, výhru, pauzu, focus, replay bez opakování, vyčerpání kategorie, obnovu po chybě JSONu, skutečný slovník, dlouhé názvy a omezené animace. Axe-core kontroluje všechny obrazovky a dialog proti pravidlům WCAG 2.2 AA. Screenshoty a případné diagnostické záznamy jsou v ignorovaném `coverage/`.

## Design a zdroje

Vzhled vychází z dodaných screenshotů a původních Frontend Mentor assetů. Odkazovaná Figma nebyla v tomto prostředí přístupná, přesnou shodu s jejími ostatními obrazovkami proto nelze potvrdit. Figma soubory se do repozitáře nepřidávají; původní `.gitignore` zůstávají zachované.

- [HTML dialog – MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [Playwright configuration](https://playwright.dev/docs/test-configuration)
- [axe-core](https://github.com/dequelabs/axe-core)
- Font Mouse Memoirs pod [SIL Open Font License](./starter-code/assets/fonts/OFL.txt).
