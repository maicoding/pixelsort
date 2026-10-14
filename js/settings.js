import { defaults } from "./engine.js";
export const effects = {
  sort: {
    name: "Pixelsort",
    description:
      "Zusammenhängende Pixel werden nach ihrem Farbwert geordnet. Schwellen und Segmentlänge bestimmen, wo Streifen entstehen.",
  },
  dither: {
    name: "Dithering",
    description:
      "Helligkeiten werden in wenige Graustufen und feine Punktmuster übersetzt.",
  },
  halftone: {
    name: "Raster",
    description:
      "Ein Punktraster übersetzt die Helligkeit in unterschiedlich große Druckpunkte.",
  },
  shift: {
    name: "Kanalversatz",
    description:
      "Rot und Blau werden gegeneinander verschoben. Der Grünkanal bleibt an seiner Position.",
  },
  duotone: {
    name: "Duoton",
    description:
      "Zwei wählbare Farben ersetzen die dunklen und hellen Bildbereiche.",
  },
};
export const presets = {
  streaks: { ...defaults },
  broken: {
    ...defaults,
    interval: "random",
    length: 65,
    seed: 123,
    lower: 0,
    upper: 255,
  },
  diagonal: {
    ...defaults,
    direction: "diagonal",
    metric: "hue",
    lower: 20,
    upper: 240,
    length: 380,
  },
  ink: { ...defaults, effect: "dither", pattern: "floyd", contrast: 25 },
  signal: { ...defaults, effect: "shift", offset: 20 },
  duo: { ...defaults, effect: "duotone" },
};
export const schema = {
  metric: {
    label: "Sortierwert",
    options: {
      brightness: "Helligkeit",
      hue: "Farbton",
      saturation: "Sättigung",
      red: "Rot",
      green: "Grün",
      blue: "Blau",
    },
  },
  direction: {
    label: "Richtung",
    options: {
      horizontal: "Horizontal →",
      vertical: "Vertikal ↓",
      diagonal: "Diagonal ↘",
      anti: "Diagonal ↙",
    },
  },
  interval: {
    label: "Intervalle",
    options: {
      threshold: "Zwischen Schwellen",
      outside: "Außerhalb der Schwellen",
      random: "Zufällige Segmente",
      whole: "Ganze Linien",
    },
  },
  lower: { label: "Untere Schwelle", min: 0, max: 255, step: 1 },
  upper: { label: "Obere Schwelle", min: 0, max: 255, step: 1 },
  length: { label: "Segmentlänge", min: 2, max: 2000, step: 1, suffix: " px" },
  strength: { label: "Stärke", min: 0, max: 100, step: 1, suffix: " %" },
  reverse: { label: "Absteigend sortieren", type: "checkbox" },
  seed: { label: "Zufallswert", min: 0, max: 999999, step: 1, type: "number" },
  levels: { label: "Graustufen", min: 2, max: 8, step: 1 },
  pattern: {
    label: "Verfahren",
    options: {
      bayer: "Bayer 4 × 4",
      floyd: "Floyd–Steinberg",
      noise: "Zufallsrauschen",
    },
  },
  size: { label: "Rasterweite", min: 3, max: 32, step: 1, suffix: " px" },
  offset: { label: "Versatz", min: 0, max: 100, step: 1, suffix: " px" },
  shadow: { label: "Schatten", type: "color" },
  highlight: { label: "Lichter", type: "color" },
  brightness: { label: "Helligkeit", min: -100, max: 100, step: 1 },
  contrast: { label: "Kontrast", min: -100, max: 100, step: 1 },
  saturation: { label: "Sättigung", min: 0, max: 200, step: 1, suffix: " %" },
};
export const fields = {
  sort: [
    "metric",
    "direction",
    "interval",
    "lower",
    "upper",
    "length",
    "reverse",
    "strength",
    "seed",
  ],
  dither: ["pattern", "levels", "strength", "seed"],
  halftone: ["size", "strength"],
  shift: ["offset", "strength"],
  duotone: ["shadow", "highlight", "strength"],
};
export function validateRecipe(raw) {
  if (
    !raw ||
    raw.version !== 1 ||
    !raw.settings ||
    typeof raw.settings !== "object"
  )
    throw new Error("Dieses Rezept wird nicht unterstützt.");
  const s = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const v = raw.settings[key];
    if (v === undefined) continue;
    if (key === "effect") {
      if (!effects[v]) throw new Error("Unbekanntes Werkzeug.");
    } else {
      const rule = schema[key];
      if (rule.options && !Object.hasOwn(rule.options, v))
        throw new Error("Ungültige Option.");
      if (rule.type === "color" && !/^#[0-9a-f]{6}$/i.test(v))
        throw new Error("Ungültiger Farbwert.");
      if (rule.type === "checkbox" && typeof v !== "boolean")
        throw new Error("Ungültiger Schalter.");
      if (
        rule.min !== undefined &&
        (typeof v !== "number" ||
          !Number.isFinite(v) ||
          v < rule.min ||
          v > rule.max ||
          !Number.isInteger(v))
      )
        throw new Error("Ungültiger Zahlenwert.");
    }
    s[key] = v;
  }
  if (s.lower > s.upper)
    throw new Error("Die untere Schwelle liegt über der oberen.");
  return s;
}
