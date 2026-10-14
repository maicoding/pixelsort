import { processImage } from "./engine.js";
self.onmessage = ({ data: { pixels, width, height, settings } }) => {
  try {
    const result = processImage(pixels, width, height, settings);
    self.postMessage({ pixels: result }, [result.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
