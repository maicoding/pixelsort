export const defaults = {
  effect: "sort",
  metric: "brightness",
  direction: "horizontal",
  interval: "threshold",
  lower: 45,
  upper: 220,
  length: 240,
  strength: 100,
  reverse: false,
  seed: 42,
  brightness: 0,
  contrast: 0,
  saturation: 100,
  levels: 2,
  pattern: "bayer",
  size: 7,
  offset: 12,
  shadow: "#24211e",
  highlight: "#ee7846",
};
export function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function value(r, g, b, metric) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  switch (metric) {
    case "red":
      return r;
    case "green":
      return g;
    case "blue":
      return b;
    case "saturation":
      return max ? (d / max) * 255 : 0;
    case "hue": {
      if (!d) return 0;
      let h =
        max === r
          ? (g - b) / d + (g < b ? 6 : 0)
          : max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      return (h / 6) * 255;
    }
    default:
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}
const clamp = (x) => Math.max(0, Math.min(255, Math.round(x)));
export function processImage(input, w, h, settings) {
  const s = { ...defaults, ...settings },
    base = new Uint8ClampedArray(input),
    data = new Uint8ClampedArray(input),
    rng = random(s.seed);
  if (base.length !== w * h * 4) throw new Error("Ungültige Bildgröße");
  const contrast = (259 * (s.contrast + 255)) / (255 * (259 - s.contrast));
  for (let i = 0; i < data.length; i += 4) {
    const l = value(data[i], data[i + 1], data[i + 2], "brightness");
    for (let c = 0; c < 3; c++)
      data[i + c] = clamp(
        contrast * (l + ((data[i + c] - l) * s.saturation) / 100 - 128) +
          128 +
          s.brightness,
      );
  }
  const prepared = new Uint8ClampedArray(data);
  if (s.effect === "sort") {
    const eligible = (i) => {
      if (!data[i + 3]) return false;
      const v = value(data[i], data[i + 1], data[i + 2], s.metric);
      return s.interval === "outside"
        ? v < s.lower || v > s.upper
        : v >= s.lower && v <= s.upper;
    };
    const sortLine = (indices) => {
      let p = 0;
      while (p < indices.length) {
        if (
          s.interval !== "random" &&
          s.interval !== "whole" &&
          !eligible(indices[p])
        ) {
          p++;
          continue;
        }
        const segment = [];
        const limit =
          s.interval === "whole"
            ? indices.length
            : s.interval === "random"
              ? Math.max(2, Math.floor(2 + rng() * s.length))
              : s.length;
        while (
          p < indices.length &&
          segment.length < limit &&
          (s.interval === "random" || s.interval === "whole"
            ? data[indices[p] + 3] > 0
            : eligible(indices[p]))
        ) {
          const i = indices[p++];
          segment.push({
            i,
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
            a: data[i + 3],
            v: value(data[i], data[i + 1], data[i + 2], s.metric),
          });
        }
        if (!segment.length) {
          p++;
          continue;
        }
        const sorted = segment
          .slice()
          .sort((a, b) => (s.reverse ? b.v - a.v : a.v - b.v));
        segment.forEach((px, j) => {
          const q = sorted[j];
          data.set([q.r, q.g, q.b, q.a], px.i);
        });
      }
    };
    if (s.direction === "horizontal") {
      for (let y = 0; y < h; y++)
        sortLine(Array.from({ length: w }, (_, x) => (y * w + x) * 4));
    } else if (s.direction === "vertical") {
      for (let x = 0; x < w; x++)
        sortLine(Array.from({ length: h }, (_, y) => (y * w + x) * 4));
    } else {
      const mirror = s.direction === "anti";
      for (let start = -(h - 1); start < w; start++) {
        const line = [];
        for (let y = Math.max(0, -start); y < h && start + y < w; y++) {
          const x = start + y;
          line.push((y * w + (mirror ? w - 1 - x : x)) * 4);
        }
        sortLine(line);
      }
    }
  } else if (s.effect === "dither") {
    const n = s.levels - 1,
      quant = (v) =>
        (Math.round((Math.max(0, Math.min(255, v)) / 255) * n) * 255) / n;
    if (s.pattern === "floyd") {
      const lum = new Float32Array(w * h);
      for (let i = 0; i < lum.length; i++)
        lum[i] = value(
          data[i * 4],
          data[i * 4 + 1],
          data[i * 4 + 2],
          "brightness",
        );
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const p = y * w + x,
            i = p * 4;
          if (!data[i + 3]) continue;
          const old = lum[p],
            v = quant(old),
            err = old - v;
          data[i] = data[i + 1] = data[i + 2] = v;
          for (const [dx, dy, f] of [
            [1, 0, 7],
            [-1, 1, 3],
            [0, 1, 5],
            [1, 1, 1],
          ]) {
            const nx = x + dx,
              ny = y + dy;
            if (nx >= 0 && nx < w && ny < h && data[(ny * w + nx) * 4 + 3])
              lum[ny * w + nx] += (err * f) / 16;
          }
        }
    } else {
      const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const t =
            s.pattern === "noise"
              ? rng() - 0.5
              : (bayer[(y % 4) * 4 + (x % 4)] + 0.5) / 16 - 0.5;
          const v = quant(
            value(data[i], data[i + 1], data[i + 2], "brightness") +
              (t * 255) / n,
          );
          data[i] = data[i + 1] = data[i + 2] = v;
        }
    }
  } else if (s.effect === "halftone") {
    const size = s.size;
    for (let by = 0; by < h; by += size)
      for (let bx = 0; bx < w; bx += size) {
        let sum = 0,
          count = 0;
        for (let y = by; y < Math.min(h, by + size); y++)
          for (let x = bx; x < Math.min(w, bx + size); x++) {
            const i = (y * w + x) * 4;
            if (data[i + 3]) {
              sum += value(data[i], data[i + 1], data[i + 2], "brightness");
              count++;
            }
          }
        const radius =
          Math.sqrt(1 - (count ? sum / count : 255) / 255) * size * 0.7;
        for (let y = by; y < Math.min(h, by + size); y++)
          for (let x = bx; x < Math.min(w, bx + size); x++) {
            const i = (y * w + x) * 4;
            const distance = Math.hypot(
              x + 0.5 - (bx + size / 2),
              y + 0.5 - (by + size / 2),
            );
            const v = clamp((distance - radius + 0.5) * 255);
            data[i] = data[i + 1] = data[i + 2] = v;
          }
      }
  } else if (s.effect === "shift") {
    const shift = s.offset;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        data[i] = prepared[(y * w + Math.max(0, x - shift)) * 4];
        data[i + 2] = prepared[(y * w + Math.min(w - 1, x + shift)) * 4 + 2];
      }
  } else if (s.effect === "duotone") {
    const rgb = (hex) =>
        [1, 3, 5].map((p) => parseInt(hex.slice(p, p + 2), 16)),
      lo = rgb(s.shadow),
      hi = rgb(s.highlight);
    for (let i = 0; i < data.length; i += 4) {
      const l = value(data[i], data[i + 1], data[i + 2], "brightness") / 255;
      for (let c = 0; c < 3; c++) data[i + c] = lo[c] + (hi[c] - lo[c]) * l;
    }
  }
  const mix = s.strength / 100;
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++)
      data[i + c] = prepared[i + c] * (1 - mix) + data[i + c] * mix;
    data[i + 3] = base[i + 3];
  }
  return data;
}
