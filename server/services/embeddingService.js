const { pipeline } = require("@xenova/transformers");

let extractor;

/* ---------------- LOAD MODEL ---------------- */

const loadModel = async () => {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  return extractor;
};

/* ---------------- GENERATE EMBEDDING ---------------- */

const generateEmbedding = async (text) => {
  try {
    const model = await loadModel();

    const output = await model(text, {
      pooling: "mean",

      normalize: true,
    });

    /* ---------- DEBUG ---------- */

    console.log("MODEL OUTPUT:", output);

    /* ---------- VALIDATION ---------- */

    if (!output || !output.data) {
      throw new Error("Embedding generation failed");
    }

    const embedding = Array.from(output.data);

    console.log("Embedding Length:", embedding.length);

    return embedding;
  } catch (error) {
    console.error("EMBEDDING ERROR:", error);

    throw error;
  }
};

module.exports = generateEmbedding;
