import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ALPHABET, MAX_MISTAKES, createRound, createWordPicker, describePuzzle, guessLetter, isGuessable, normalizeLetter } from "../../starter-code/js/game.js";

const play = (word, guesses) => [...guesses].reduce(guessLetter, createRound("Test", word));
const data = { categories: {
  Animals: [{ name: "Otter", selected: false }, { name: "Fox", selected: false }],
  Countries: [{ name: "France", selected: false }],
} };

test("new rounds start with eight lives and no guesses", () => {
  assert.equal(MAX_MISTAKES, 8);
  assert.equal(ALPHABET.length, 26);
  assert.deepEqual(createRound("Animals", "Otter"), {
    category: "Animals", word: "Otter", guesses: [], mistakes: 0, status: "playing",
  });
});

test("one guess reveals every occurrence without mutating the previous state", () => {
  const initial = createRound("Animals", "Otter");
  const next = guessLetter(initial, "t");
  assert.deepEqual(initial.guesses, []);
  assert.deepEqual(next.guesses, ["T"]);
  assert.equal(next.mistakes, 0);
  assert.equal(describePuzzle(next), "Word 1: blank, T, T, blank, blank.");
});

test("case-insensitive repeated guesses never cost extra health", () => {
  const initial = play("Otter", "z");
  assert.equal(guessLetter(initial, "Z"), initial);
  assert.equal(initial.mistakes, 1);
});

test("spaces, punctuation, numbers, empty strings, and multi-letter inputs are ignored", () => {
  const round = createRound("Test", "Otter");
  for (const input of [" ", "!", "1", "", "ab", "Enter", "Escape", "🙂"]) {
    assert.equal(guessLetter(round, input), round);
  }
});

test("the eighth different wrong guess loses, with no earlier loss", () => {
  const seven = play("A", "bcdefgh");
  assert.equal(seven.status, "playing");
  assert.equal(seven.mistakes, 7);
  const eight = guessLetter(seven, "i");
  assert.equal(eight.status, "lost");
  assert.equal(eight.mistakes, 8);
  assert.equal(guessLetter(eight, "a"), eight);
});

test("completing every distinct letter wins and freezes subsequent guesses", () => {
  const round = play("Otter", "otre");
  assert.equal(round.status, "won");
  assert.equal(round.mistakes, 0);
  assert.equal(guessLetter(round, "z"), round);
});

test("a player can win with only one life left", () => {
  const round = play("A", "bcdefgha");
  assert.equal(round.status, "won");
  assert.equal(round.mistakes, 7);
});

test("spaces, hyphens and apostrophes are automatically revealed", () => {
  assert.equal(play("A-B's 2", "abs").status, "won");
  assert.equal(describePuzzle(createRound("Test", "A-B's 2")), "Word 1: blank, -, blank, ', blank. Word 2: 2.");
});

test("accented Latin letters can be guessed with an ordinary A-Z keyboard", () => {
  assert.equal(play("Café", "cafe").status, "won");
});

test("the accessible puzzle description does not expose unguessed letters", () => {
  const description = describePuzzle(play("United Kingdom", "uni"));
  assert.equal(description, "Word 1: U, N, I, blank, blank, blank. Word 2: blank, I, N, blank, blank, blank, blank.");
  assert.ok(!description.includes("United"));
});

test("a word picker never repeats within a visit, even after exhausting its pool", () => {
  const picker = createWordPicker(data, () => 0);
  assert.equal(picker.next("Animals"), "Otter");
  assert.equal(picker.remaining("Animals"), 1);
  assert.equal(picker.next("Animals"), "Fox");
  assert.equal(picker.next("Animals"), null);
  assert.equal(picker.remaining("Animals"), 0);
});

test("category changes retain selection history without changing the original JSON", () => {
  const original = structuredClone(data);
  const picker = createWordPicker(data, () => 0);
  picker.next("Animals");
  picker.next("Countries");
  assert.equal(picker.next("Animals"), "Fox");
  assert.deepEqual(data, original);
});

test("the random source chooses among all remaining words", () => {
  const picker = createWordPicker(data, () => .9999);
  assert.equal(picker.next("Animals"), "Fox");
  assert.equal(picker.next("Animals"), "Otter");
});

test("selected flags and duplicate names cannot cause repeated puzzles", () => {
  const picker = createWordPicker({ categories: { Test: [
    { name: "A", selected: true }, { name: "A" }, { name: "B" }, { name: "B" },
  ] } }, () => 0);
  assert.equal(picker.next("Test"), "B");
  assert.equal(picker.next("Test"), null);
});

test("bad data and unknown categories fail explicitly", () => {
  for (const invalid of [null, {}, { categories: [] }, { categories: {} }, { categories: { Test: [] } }, { categories: { Test: [{ name: "123" }] } }]) {
    assert.throws(() => createWordPicker(invalid), TypeError);
  }
  assert.throws(() => createRound("Test", " "), TypeError);
  assert.throws(() => createWordPicker(data).next("Unknown"), RangeError);
  assert.throws(() => createWordPicker(data, () => 1).next("Animals"), RangeError);
});

test("every supplied category can be played to exhaustion with no duplicates", async () => {
  const json = JSON.parse(await readFile(new URL("../../starter-code/data.json", import.meta.url), "utf8"));
  const picker = createWordPicker(json);
  assert.equal(picker.categories.length, 6);
  for (const category of picker.categories) {
    const expected = new Set(json.categories[category].map((entry) => entry.name));
    const actual = new Set();
    let word;
    while ((word = picker.next(category)) !== null) {
      assert.ok(!actual.has(word));
      actual.add(word);
      const answer = Array.from(word).filter(isGuessable).map(normalizeLetter).join("");
      assert.equal(play(word, answer).status, "won");
    }
    assert.deepEqual(actual, expected);
  }
});
