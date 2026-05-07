const express = require("express");

const Document = require("../models/Document");
const generateEmbedding = require("../services/embeddingService");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

/* ---------------- GEMINI SETUP ---------------- */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

/* ---------------- COSINE SIMILARITY ---------------- */

const cosineSimilarity = (vecA, vecB) => {
  // Safety checks
  if (!vecA || !vecB) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // Prevent length mismatch issues
  const length = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];

    normA += vecA[i] * vecA[i];

    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/* ---------------- QUERY ROUTE ---------------- */

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;

    /* ---------- VALIDATION ---------- */

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    /* ---------- GENERATE QUESTION EMBEDDING ---------- */

    const queryEmbedding = await generateEmbedding(question);

    /* ---------- FETCH DOCUMENTS ---------- */

    const documents = await Document.find();

    /* ---------- FILTER VALID DOCUMENTS ---------- */

    const validDocs = documents.filter(
      (doc) => Array.isArray(doc.embedding) && doc.embedding.length > 0,
    );

    if (validDocs.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No valid embedded documents found",
      });
    }

    /* ---------- CALCULATE SIMILARITY ---------- */

    const scoredDocs = validDocs.map((doc) => ({
      text: doc.text,

      source: doc.source,

      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    /* ---------- SORT TOP MATCHES ---------- */

    scoredDocs.sort((a, b) => b.similarity - a.similarity);

    const topDocs = scoredDocs.slice(0, 3);

    /* ---------- CREATE CONTEXT ---------- */

    const context = topDocs.map((doc) => doc.text).join("\n\n");

    /* ---------- FINAL PROMPT ---------- */

    const prompt = `
You are an SOP assistant.

Answer the user's question ONLY using the provided context.

If the answer is not available in the context,
say:
"I could not find relevant information in the uploaded document."

Context:
${context}

Question:
${question}
`;

    /* ---------- GEMINI RESPONSE ---------- */

    const result = await model.generateContent(prompt);

    const answer = result.response.text();

    /* ---------- FINAL RESPONSE ---------- */

    res.status(200).json({
      success: true,

      question,

      answer,

      sources: topDocs.map((doc) => doc.source),
    });
  } catch (error) {
    console.error("QUERY ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Query processing failed",
    });
  }
});

module.exports = router;
