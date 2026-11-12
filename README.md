# The Hangman Game

A responsive implementation of the [Frontend Mentor Hangman challenge](https://www.frontendmentor.io), built with HTML, CSS, and modular JavaScript. The project follows a mobile-first approach and has no framework or production dependencies. The original brief is preserved in [docs/CHALLENGE.md](./docs/CHALLENGE.md).

## Deploying to Netlify

The repository includes a [netlify.toml](./netlify.toml) configuration file. Netlify builds the project and serves the generated static files. **Playing the deployed game does not require `npm run dev`, a local terminal, or a running Node.js server.**

### Connect the Git repository

1. Push this repository, including `netlify.toml`, to your Git provider.
2. In Netlify, import the existing repository and select the branch you want to deploy.
3. Deploy the project using the settings below. They are already defined in `netlify.toml`.

| Setting               | Value                 |
| --------------------- | --------------------- |
| Base directory        | Repository root (`.`) |
| Build command         | `npm run build`       |
| Publish directory     | `dist`                |
| Build Node.js version | `22`                  |

After a successful deployment, open the URL provided by Netlify. Subsequent pushes to the connected deployment branch trigger a new build and deployment.

The build copies the application, word data, SVG assets, and local font into `dist/`. This directory is generated during deployment and is intentionally excluded from Git. The game switches screens within the same page, so it does not need a catch-all SPA redirect.

### Manual deployment

You can also build locally and upload the output folder to Netlify:

```sh
npm run build
```

Upload **`dist/`**, which contains `index.html` at its root. The deployed files run directly on static hosting.

For the configuration format, see the [Netlify file-based configuration documentation](https://docs.netlify.com/build/configure-builds/file-based-configuration/).

## Running locally

Use Node.js 20 or newer. The Netlify build uses Node.js 22 as configured above.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The application and local server can run without installing packages; development dependencies are only needed for the automated browser tests.

To preview the production output locally:

```sh
npm run build
npm run preview
```

The preview uses the same local address. Use an HTTP server for local testing: opening `index.html` directly through `file://` does not support the game's ES modules and JSON loading. Netlify provides the HTTP hosting for the deployed version.

The contents of `dist/` can also be deployed to other static hosts. Asset paths are relative, allowing deployment to a subdirectory.

## Features and controls

- Main menu, instructions, and six categories containing 180 names from the supplied `data.json`.
- Random word selection without repeats during a visit, including after changing categories or returning to the menu.
- Correct guesses reveal every occurrence of a letter. Eight distinct incorrect guesses end the round.
- Win and loss dialogs offer another round, a different category, or a return to the menu.
- Exhausted categories become unavailable. Reloading the page starts a new visit and resets the word pool.
- Mouse, touch, Tab / Shift+Tab, Enter / Space, and direct A-Z keyboard input. Escape pauses the game and resumes a paused round.
- Guesses are blocked while paused. Duplicate guesses, held keys, and Ctrl / Cmd / Alt shortcuts do not count as new guesses.
- A recoverable word-loading error with a Try again button.

The interface is in English, matching the design and supplied word list.

## Architecture

```text
netlify.toml       Netlify build and static publishing configuration
starter-code/
  index.html       semantic screens and native dialog
  styles.css       mobile-first styles, 600 px and 1100 px breakpoints
  data.json        original, unchanged word list
  js/game.js       pure state transitions, word selection, puzzle descriptions
  js/app.js        DOM updates, data loading, focus management, input handling
  assets/          original SVGs and local Mouse Memoirs font
scripts/
  serve.mjs        local HTTP server
  build.mjs        static production output generation
tests/
  unit/            game-rule tests using node:test
  e2e/             Playwright scenarios and axe-core accessibility checks
```

`guessLetter` does not mutate its input state. Word selection tracks played names in memory without changing the supplied JSON objects. State is not stored on a server or in localStorage. Four screens and a single game are handled with native JavaScript modules rather than a framework, router, or global state library.

Words wrap as complete groups. Container query units limit tile widths for unusually long individual words. Mobile, tablet, and desktop layouts use their corresponding supplied backgrounds. The font is hosted locally and preloaded.

## Accessibility

- Hidden screens are excluded from the focus order. Navigation moves focus to the new heading; returning to the menu focuses Play.
- Native `dialog.showModal()` makes the background inert. Tab navigation stays inside the dialog in both directions, and resuming returns focus to Pause.
- `aria-disabled` preserves focus on the letter just used. Event handlers ignore repeated guesses.
- Health is exposed as a labelled `meter`. A persistent live region announces guesses, remaining lives, and puzzle progress without revealing unguessed letters.
- Decorative images and visual letter tiles are hidden from screen readers. The puzzle has a separate text description.
- Visible focus indicators, a skip link, contrasting controls, and support for `prefers-reduced-motion`.

Automated checks do not cover every accessibility issue. Manual testing with NVDA or VoiceOver is recommended before submitting the solution.

## Testing

```sh
npm test
npm run test:e2e
npm run test:all
```

Browser tests use an installed Google Chrome in headless mode by default. Set `PLAYWRIGHT_CHANNEL` to use another channel, such as `msedge` or `chromium`. The Chromium channel requires `npx playwright install chromium`.

Tests run at **375 x 812**, **768 x 1024**, and **1440 x 1024**, with additional layout checks at eight widths between 320 and 1100 px. They cover keyboard navigation, repeated letters, duplicate guesses, eight incorrect guesses, winning, pausing, focus management, replay without repeated words, category exhaustion, recovery after data-loading failures, the real word list, long names, and reduced motion. Axe-core checks every screen and the dialog against its WCAG 2.2 AA rules. Screenshots and failure diagnostics are written to the ignored `coverage/` directory.

- [HTML dialog - MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- [Playwright configuration](https://playwright.dev/docs/test-configuration)
- [axe-core](https://github.com/dequelabs/axe-core)
- Mouse Memoirs font under the [SIL Open Font License](./starter-code/assets/fonts/OFL.txt).
