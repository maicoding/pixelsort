import test from "node:test";
import assert from "node:assert/strict";
import { processImage, defaults } from "../js/engine.js";
import { validateRecipe } from "../js/settings.js";
const px = (values) =>
  new Uint8ClampedArray(values.flatMap((v) => [v, v, v, 255]));
test("horizontal whole-line sorting preserves pixels", () => {
  const input = px([240, 20, 180, 80]);
  const out = processImage(input, 4, 1, {
    interval: "whole",
    lower: 0,
    upper: 255,
  });
  assert.deepEqual([...out], [...px([20, 80, 180, 240])]);
  assert.deepEqual([...input], [...px([240, 20, 180, 80])]);
});
test("threshold gaps remain untouched", () => {
  const out = processImage(px([160, 80, 5, 140, 60]), 5, 1, {
    lower: 50,
    upper: 200,
  });
  assert.deepEqual([...out], [...px([80, 160, 5, 60, 140])]);
});
test("vertical and diagonals preserve color multiset", () => {
  for (const direction of ["vertical", "diagonal", "anti"]) {
    const input = px([250, 200, 150, 100, 50, 20]);
    const out = processImage(input, 3, 2, { direction, interval: "whole" });
    assert.deepEqual(
      [...out].sort((a, b) => a - b),
      [...input].sort((a, b) => a - b),
    );
  }
});
test("zero strength and all effects preserve alpha", () => {
  const input = new Uint8ClampedArray([
    180, 80, 20, 0, 30, 60, 90, 127, 220, 180, 130, 255,
  ]);
  for (const effect of ["sort", "dither", "halftone", "shift", "duotone"]) {
    assert.deepEqual(processImage(input, 3, 1, { effect, strength: 0 }), input);
    const output = processImage(input, 3, 1, { effect });
    for (let i = 3; i < input.length; i += 4) assert.equal(output[i], input[i]);
  }
});
test("seeded random sorting is reproducible", () => {
  const input = px(Array.from({ length: 100 }, (_, i) => (i * 57) % 256));
  assert.deepEqual(
    processImage(input, 100, 1, { interval: "random", length: 20, seed: 5 }),
    processImage(input, 100, 1, { interval: "random", length: 20, seed: 5 }),
  );
});
test("dithering produces requested levels", () => {
  for (const pattern of ["bayer", "floyd", "noise"]) {
    const out = processImage(px([0, 30, 70, 100, 140, 180, 230, 255]), 4, 2, {
      effect: "dither",
      pattern,
      levels: 2,
    });
    for (let i = 0; i < out.length; i += 4)
      assert.ok([0, 255].includes(out[i]));
  }
});
test("recipes reject invalid numeric and option values", () => {
  assert.deepEqual(
    validateRecipe({ version: 1, settings: defaults }),
    defaults,
  );
  for (const s of [
    { length: -1 },
    { effect: "unknown" },
    { seed: NaN },
    { shadow: "bad" },
    { lower: 240, upper: 10 },
    { direction: "xxx" },
  ])
    assert.throws(() => validateRecipe({ version: 1, settings: s }));
});
