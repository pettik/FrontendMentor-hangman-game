import { ALPHABET, MAX_MISTAKES, createRound, createWordPicker, describePuzzle, guessLetter, isGuessable, normalizeLetter } from "./game.js";

const $ = (id) => document.getElementById(id);
const dialog = $("game-dialog");
const keyboard = $("letter-keyboard");
const puzzle = $("puzzle");
const announcement = $("game-announcement");
let picker;
let round;
let screen = "home";

function announce(message) { announcement.textContent = message; }
function closeDialog() { if (dialog.open) dialog.close(); }

function showScreen(next, { focus = true } = {}) {
  closeDialog();
  screen = next;
  document.body.dataset.screen = next;
  for (const section of document.querySelectorAll("main > section")) {
    section.hidden = section.id !== `${next}-screen`;
  }
  const titles = { home: "Hangman", instructions: "How to Play", categories: "Pick a Category", game: round?.category };
  document.title = `${titles[next]} | The Hangman Game`;
  if (next === "categories") renderCategories();
  if (focus) {
    const target = next === "home" ? $("play-button") : $(`${next}-screen`).querySelector("h1");
    (target.disabled ? document.querySelector('[data-action="instructions"]') : target).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function renderCategories() {
  const fragment = document.createDocumentFragment();
  for (const category of picker.categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.dataset.category = category;
    button.textContent = category;
    button.disabled = picker.remaining(category) === 0;
    if (button.disabled) {
      const note = document.createElement("span");
      note.className = "category-note";
      note.textContent = "All words played";
      button.append(note);
    }
    fragment.append(button);
  }
  $("category-list").replaceChildren(fragment);
  $("categories-message").textContent = picker.categories.every((category) => !picker.remaining(category))
    ? "You’ve played every word! Refresh the page to start a new visit." : "";
}

function startGame(category) {
  const word = picker.next(category);
  if (!word) {
    showScreen("categories");
    announce("You’ve played every word in this category. Choose another category.");
    return;
  }
  round = createRound(category, word);
  $("category-title").textContent = category;
  buildKeyboard();
  buildPuzzle();
  updateGame();
  showScreen("game");
  const lengths = word.split(/\s+/).map((part) => Array.from(part).filter(isGuessable).length);
  announce(`${category}. ${lengths.length} ${lengths.length === 1 ? "word" : "words"}, ${lengths.join(", ")} letters. Eight lives remaining. ${describePuzzle(round)}`);
}

function buildKeyboard() {
  keyboard.replaceChildren(...ALPHABET.map((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-key";
    button.dataset.letter = letter;
    button.textContent = letter;
    button.setAttribute("aria-label", `Guess ${letter}`);
    button.setAttribute("aria-keyshortcuts", letter);
    return button;
  }));
}

function buildPuzzle() {
  puzzle.replaceChildren(...round.word.split(/\s+/).map((word) => {
    const group = document.createElement("span");
    group.className = "word";
    group.style.setProperty("--characters", Array.from(word).length);
    for (const character of word) {
      const tile = document.createElement("span");
      tile.className = `letter-tile${isGuessable(character) ? "" : " letter-tile--punctuation"}`;
      group.append(tile);
    }
    return group;
  }));
}

function updateGame() {
  const characters = Array.from(round.word).filter((character) => !/\s/.test(character));
  [...puzzle.querySelectorAll(".letter-tile")].forEach((tile, index) => {
    const character = characters[index];
    const guessed = round.guesses.includes(normalizeLetter(character));
    const revealed = !isGuessable(character) || guessed || round.status === "lost";
    tile.textContent = revealed ? character.toUpperCase() : "";
    tile.classList.toggle("is-revealed", revealed);
    tile.classList.toggle("is-missed", round.status === "lost" && !guessed && isGuessable(character));
  });
  for (const button of keyboard.children) {
    const used = round.guesses.includes(button.dataset.letter);
    button.setAttribute("aria-disabled", String(used || round.status !== "playing"));
    button.classList.toggle("is-used", used);
    button.setAttribute("aria-label", `${button.dataset.letter}${used ? ", already guessed" : ", guess letter"}`);
  }
  const lives = MAX_MISTAKES - round.mistakes;
  $("health-fill").style.transform = `scaleX(${lives / MAX_MISTAKES})`;
  $("health-meter").setAttribute("aria-valuenow", lives);
  $("health-meter").setAttribute("aria-valuetext", `${lives} of ${MAX_MISTAKES} lives remaining`);
  $("puzzle-description").textContent = describePuzzle(round);
}

function guess(input) {
  if (screen !== "game" || dialog.open || !round) return;
  const next = guessLetter(round, input);
  if (next === round) return;
  const correct = next.mistakes === round.mistakes;
  round = next;
  updateGame();
  const lives = MAX_MISTAKES - round.mistakes;
  announce(`${normalizeLetter(input)} is ${correct ? "correct" : "not in the word"}. ${lives} ${lives === 1 ? "life" : "lives"} remaining. ${describePuzzle(round)}`);
  if (round.status !== "playing") openDialog();
}

function openDialog() {
  if (!round || dialog.open) return;
  const paused = round.status === "playing";
  const canReplay = picker.remaining(round.category) > 0;
  const title = paused ? "Paused" : round.status === "won" ? "You Win" : "You Lose";
  $("dialog-title-label").textContent = title;
  $("dialog-title").dataset.heading = title;
  $("dialog-description").textContent = paused
    ? "Take your time. Your game will be right here."
    : `The answer was ${round.word}.${canReplay ? "" : " You’ve played every word in this category!"}`;
  $("resume-button").hidden = !paused;
  $("again-button").hidden = paused || !canReplay;
  dialog.showModal();
  const target = paused ? $("resume-button") : canReplay ? $("again-button") : dialog.querySelector('[data-action="categories"]');
  target.focus();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
  if (button.dataset.category) return startGame(button.dataset.category);
  if (button.dataset.letter) return guess(button.dataset.letter);
  switch (button.dataset.action) {
    case "instructions": return showScreen("instructions");
    case "home": return showScreen("home");
    case "categories": return showScreen("categories");
    case "resume": closeDialog(); $("pause-button").focus(); break;
    case "again": startGame(round.category); break;
  }
});

$("play-button").addEventListener("click", () => showScreen("categories"));
$("pause-button").addEventListener("click", openDialog);
$("retry-button").addEventListener("click", loadWords);

// Keep both Tab directions in the modal, including at the browser UI boundary.
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const buttons = [...dialog.querySelectorAll("button:not([hidden]):not(:disabled)")];
  const first = buttons[0];
  const last = buttons.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if (screen !== "game" || dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
  if (event.key === "Escape" && round.status === "playing") {
    event.preventDefault();
    openDialog();
  } else if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    guess(event.key);
  }
});

dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  if (round.status === "playing") {
    closeDialog();
    $("pause-button").focus();
  }
});

async function loadWords() {
  $("retry-button").hidden = true;
  $("play-button").disabled = true;
  $("load-message").textContent = "Loading your next challenge…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL("../data.json", import.meta.url), { signal: controller.signal });
    if (!response.ok) throw new Error(`Word list request failed: ${response.status}`);
    picker = createWordPicker(await response.json());
    $("play-button").disabled = false;
    $("load-message").textContent = "";
  } catch {
    $("load-message").textContent = "We couldn’t load the words. Check your connection and try again.";
    $("retry-button").hidden = false;
  } finally {
    clearTimeout(timeout);
  }
}

loadWords();
