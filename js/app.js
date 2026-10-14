import { defaults, random } from "./engine.js";
import {
  effects,
  presets,
  schema,
  fields,
  validateRecipe,
} from "./settings.js";
const $ = (id) => document.getElementById(id),
  result = $("result"),
  original = $("original"),
  frame = $("image-frame");
let settings = { ...defaults },
  source = null,
  sourceName = "Studie 01",
  worker = null,
  timer = null,
  view = "result",
  fitted = true,
  resultReady = false,
  loadId = 0,
  jobId = 0;
let history = [{ ...settings }],
  historyIndex = 0;
const status = (text) => ($("status").textContent = text);
function record() {
  const next = { ...settings };
  if (JSON.stringify(next) === JSON.stringify(history[historyIndex])) return;
  history = history.slice(0, historyIndex + 1);
  history.push(next);
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateHistory();
}
function updateHistory() {
  $("undo").disabled = historyIndex === 0;
  $("redo").disabled = historyIndex === history.length - 1;
}
function cancelRender() {
  clearTimeout(timer);
  jobId++;
  if (worker) {
    worker.terminate();
    worker = null;
  }
  document.body.classList.remove("busy");
}
function schedule() {
  cancelRender();
  resultReady = false;
  $("export").disabled = true;
  if ($("live").checked) timer = setTimeout(render, 180);
  else status("Einstellungen geändert · Anwenden");
}
function field(key) {
  const r = schema[key],
    wrap = document.createElement("div");
  wrap.className = "field";
  const label = document.createElement("label");
  label.htmlFor = "setting-" + key;
  label.textContent = r.label;
  let input;
  if (r.options) {
    input = document.createElement("select");
    for (const [value, text] of Object.entries(r.options)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      input.append(option);
    }
  } else {
    input = document.createElement("input");
    input.type = r.type || "range";
    if (r.min !== undefined) {
      input.min = r.min;
      input.max = r.max;
      input.step = r.step;
    }
    if (input.type === "range") {
      label.className = "range-title";
      const output = document.createElement("output");
      output.htmlFor = "setting-" + key;
      output.textContent = settings[key] + (r.suffix || "");
      label.append(output);
    }
  }
  input.id = "setting-" + key;
  input.dataset.key = key;
  if (input.type === "checkbox") input.checked = settings[key];
  else input.value = settings[key];
  wrap.append(label, input);
  input.addEventListener("input", () => {
    settings[key] =
      input.type === "checkbox"
        ? input.checked
        : r.min !== undefined
          ? Math.max(
              r.min,
              Math.min(r.max, Math.round(Number(input.value) || 0)),
            )
          : input.value;
    if (key === "lower" && settings.lower > settings.upper) {
      settings.upper = settings.lower;
      syncField("upper");
    }
    if (key === "upper" && settings.upper < settings.lower) {
      settings.lower = settings.upper;
      syncField("lower");
    }
    if (label.querySelector("output"))
      label.querySelector("output").textContent =
        settings[key] + (r.suffix || "");
    $("preset").value = "custom";
    schedule();
  });
  input.addEventListener("change", record);
  return wrap;
}
function syncField(key) {
  const input = $("setting-" + key);
  if (!input) return;
  input.value = settings[key];
  const output = input.parentElement.querySelector("output");
  if (output) output.textContent = settings[key] + (schema[key].suffix || "");
}
function refreshControls() {
  $("controls").replaceChildren(...fields[settings.effect].map(field));
  $("preprocess").replaceChildren(
    ...["brightness", "contrast", "saturation"].map(field),
  );
  $("effect-title").textContent = effects[settings.effect].name;
  $("effect-description").textContent = effects[settings.effect].description;
  for (const button of $("effects").children)
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.effect === settings.effect),
    );
}
for (const [key, effect] of Object.entries(effects)) {
  const button = document.createElement("button");
  button.dataset.effect = key;
  button.textContent = "[ ] " + effect.name;
  button.setAttribute("aria-pressed", "false");
  button.onclick = () => {
    settings.effect = key;
    $("preset").value = "custom";
    record();
    refreshControls();
    schedule();
  };
  $("effects").append(button);
}
function changeSettings(next) {
  settings = { ...next };
  record();
  refreshControls();
  schedule();
}
function fit() {
  if (!source) return;
  const stage = $("dropzone"),
    pad = innerWidth <= 1000 ? 40 : 80,
    ratio = fitted
      ? Math.min(
          1,
          (stage.clientWidth - pad) / result.width,
          (stage.clientHeight - 40) / result.height,
        )
      : 1;
  frame.style.width = Math.max(1, Math.floor(result.width * ratio)) + "px";
  frame.style.height = Math.max(1, Math.floor(result.height * ratio)) + "px";
  $("fit").setAttribute("aria-pressed", String(fitted));
  $("fit").textContent = fitted ? "Ansicht einpassen" : "Ansicht 100 %";
}
new ResizeObserver(fit).observe($("dropzone"));
function setSource(image, name) {
  source?.close?.();
  source = image;
  sourceName = name;
  viewMode("result");
  prepare();
}
function prepare() {
  cancelRender();
  if (!source) return;
  const max = $("resolution").value;
  const w = source.width,
    h = source.height;
  let scale =
    max === "original"
      ? Math.min(1, Math.sqrt(16000000 / (w * h)))
      : Math.min(1, Number(max) / Math.max(w, h));
  original.width = result.width = Math.max(1, Math.round(w * scale));
  original.height = result.height = Math.max(1, Math.round(h * scale));
  original
    .getContext("2d", { willReadFrequently: true })
    .drawImage(source, 0, 0, original.width, original.height);
  result.getContext("2d").drawImage(original, 0, 0);
  $("filename").textContent = sourceName;
  $("dimensions").textContent =
    `${result.width} × ${result.height} px${scale < 1 ? " · Quelle " + w + " × " + h : ""}`;
  fit();
  render();
}
function render() {
  cancelRender();
  if (!source) return;
  const id = jobId,
    start = performance.now();
  resultReady = false;
  $("export").disabled = true;
  document.body.classList.add("busy");
  status("Wird berechnet …");
  const data = original
    .getContext("2d")
    .getImageData(0, 0, original.width, original.height);
  const currentWorker = new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  });
  worker = currentWorker;
  currentWorker.onmessage = ({ data }) => {
    if (id !== jobId) return;
    document.body.classList.remove("busy");
    currentWorker.terminate();
    worker = null;
    if (data.error) {
      status("Berechnung fehlgeschlagen: " + data.error);
      return;
    }
    result
      .getContext("2d")
      .putImageData(
        new ImageData(data.pixels, result.width, result.height),
        0,
        0,
      );
    resultReady = true;
    $("export").disabled = false;
    status(`Bereit · ${Math.round(performance.now() - start)} ms`);
  };
  currentWorker.onerror = () => {
    if (id !== jobId) return;
    currentWorker.terminate();
    worker = null;
    document.body.classList.remove("busy");
    status("Berechnung fehlgeschlagen. Bitte erneut anwenden.");
  };
  currentWorker.postMessage(
    {
      pixels: data.data,
      width: original.width,
      height: original.height,
      settings: { ...settings },
    },
    [data.data.buffer],
  );
}
function demo() {
  loadId++;
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d"),
    rng = random(17);
  ctx.fillStyle = "#e8ddc6";
  ctx.fillRect(0, 0, 1000, 1000);
  ctx.fillStyle = "#ed6636";
  ctx.fillRect(500, 0, 500, 1000);
  ctx.fillStyle = "#252923";
  ctx.beginPath();
  ctx.arc(500, 500, 360, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8ddc6";
  ctx.beginPath();
  ctx.arc(500, 500, 205, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ed6636";
  ctx.fillRect(0, 720, 1000, 120);
  ctx.fillStyle = "#e8ddc6";
  for (let x = 40; x < 1000; x += 24) ctx.fillRect(x, 65, 8, 140);
  const data = ctx.getImageData(0, 0, 1000, 1000);
  for (let i = 0; i < data.data.length; i += 4) {
    const noise = (rng() - 0.5) * 35;
    for (let c = 0; c < 3; c++) data.data[i + c] += noise;
  }
  ctx.putImageData(data, 0, 0);
  setSource(canvas, "Studie 01");
}
async function loadFile(file) {
  if (!file) return;
  const id = ++loadId;
  if (!/^image\//.test(file.type)) {
    status("Bitte eine Bilddatei wählen.");
    return;
  }
  if (file.size > 60 * 1024 * 1024) {
    status("Das Bild ist größer als 60 MB. Bitte eine kleinere Datei wählen.");
    return;
  }
  status("Bild wird geladen …");
  try {
    const image = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    if (id !== loadId) {
      image.close();
      return;
    }
    setSource(image, file.name);
  } catch {
    if (id === loadId)
      status(
        "Das Bild konnte nicht geöffnet werden. Bitte PNG, JPG oder WebP versuchen.",
      );
  } finally {
    $("file").value = "";
  }
}
function viewMode(next) {
  view = next;
  for (const b of document.querySelectorAll("[data-view]"))
    b.setAttribute("aria-pressed", String(b.dataset.view === view));
  original.style.display = view === "result" ? "none" : "block";
  original.style.clipPath =
    view === "compare"
      ? `inset(0 ${100 - Number($("compare").value)}% 0 0)`
      : "none";
  $("divider").style.display = view === "compare" ? "block" : "none";
  $("divider").style.left = $("compare").value + "%";
  document.querySelector(".compare-control").hidden = view !== "compare";
  requestAnimationFrame(fit);
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportImage() {
  if (!resultReady) {
    status("Bitte zuerst die Berechnung abschließen.");
    return;
  }
  const format = $("format").value;
  let canvas = result;
  if (format === "jpeg") {
    canvas = document.createElement("canvas");
    canvas.width = result.width;
    canvas.height = result.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(result, 0, 0);
  }
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        status("Export fehlgeschlagen.");
        return;
      }
      if (blob.type !== `image/${format}`) {
        status("Dieses Ausgabeformat wird vom Browser nicht unterstützt.");
        return;
      }
      const name = sourceName
        .replace(/\.[^.]+$/, "")
        .replace(/[<>:"/\\|?*]/g, "-");
      download(
        blob,
        `${name}-${settings.effect}.${format === "jpeg" ? "jpg" : format}`,
      );
      status(
        `${format.toUpperCase()} exportiert · ${canvas.width} × ${canvas.height} px`,
      );
    },
    `image/${format}`,
    0.95,
  );
}
$("upload").onclick = () => $("file").click();
$("file").onchange = (e) => loadFile(e.target.files[0]);
$("demo").onclick = demo;
$("resolution").onchange = prepare;
$("apply").onclick = render;
$("export").onclick = exportImage;
$("fit").onclick = () => {
  fitted = !fitted;
  fit();
};
$("live").onchange = () => {
  if ($("live").checked) render();
};
$("preset").onchange = () => {
  if (presets[$("preset").value]) changeSettings(presets[$("preset").value]);
};
$("reset").onclick = () => {
  const effect = settings.effect;
  changeSettings({ ...defaults, effect });
  $("preset").value = "custom";
};
$("randomize").onclick = () => {
  const seed = Math.floor(Math.random() * 999999),
    rng = random(seed);
  changeSettings({
    ...settings,
    seed,
    lower: Math.floor(rng() * 100),
    upper: 150 + Math.floor(rng() * 105),
    length: 20 + Math.floor(rng() * 580),
    offset: Math.floor(rng() * 70),
    size: 3 + Math.floor(rng() * 20),
  });
  $("preset").value = "custom";
};
function stepHistory(delta) {
  const next = historyIndex + delta;
  if (next < 0 || next >= history.length) return;
  historyIndex = next;
  settings = { ...history[next] };
  $("preset").value = "custom";
  refreshControls();
  updateHistory();
  schedule();
}
$("undo").onclick = () => stepHistory(-1);
$("redo").onclick = () => stepHistory(1);
for (const button of document.querySelectorAll("[data-view]"))
  button.onclick = () => viewMode(button.dataset.view);
$("compare").oninput = () => viewMode("compare");
$("help-button").onclick = () => $("help").showModal();
$("help").onclick = (e) => {
  if (e.target === $("help")) $("help").close();
};
$("save-settings").onclick = () =>
  download(
    new Blob([JSON.stringify({ version: 1, settings }, null, 2)], {
      type: "application/json",
    }),
    "pixelsort-rezept.json",
  );
$("load-settings").onclick = () => $("recipe-file").click();
$("recipe-file").onchange = async (e) => {
  const file = e.target.files[0];
  try {
    if (!file) return;
    if (file.size > 100000) throw new Error("Die Rezeptdatei ist zu groß.");
    changeSettings(validateRecipe(JSON.parse(await file.text())));
    $("preset").value = "custom";
    status("Rezept geladen");
  } catch (error) {
    status(error.message);
  } finally {
    e.target.value = "";
  }
};
let dragDepth = 0;
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  $("dropzone").classList.remove("dragging");
  loadFile(e.dataTransfer.files[0]);
});
$("dropzone").addEventListener("dragenter", () => {
  dragDepth++;
  $("dropzone").classList.add("dragging");
});
$("dropzone").addEventListener("dragleave", () => {
  if (--dragDepth <= 0) $("dropzone").classList.remove("dragging");
});
document.addEventListener("keydown", (e) => {
  const typing = ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName);
  if ($("help").open) return;
  if (e.metaKey || e.ctrlKey) {
    if (e.key.toLowerCase() === "o") {
      e.preventDefault();
      $("file").click();
    }
    if (e.key.toLowerCase() === "s") {
      e.preventDefault();
      exportImage();
    }
    if (e.key.toLowerCase() === "z" && !typing) {
      e.preventDefault();
      stepHistory(e.shiftKey ? 1 : -1);
    }
  } else if (e.key === "Enter" && !typing && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    render();
  }
});
refreshControls();
demo();
