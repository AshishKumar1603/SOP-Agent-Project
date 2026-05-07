const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");

const parsePDF = require("../utils/pdfParser");
const chunkText = require("../utils/chunkText");

const generateEmbedding = require("../services/embeddingService");

const Document = require("../models/Document");

const router = express.Router();

/* ---------------- STORAGE CONFIG ---------------- */

const storage = multer.diskStorage({
  destination: "uploads/",

  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

/* ---------------- FILE FILTER ---------------- */

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed"), false);
  }

  cb(null, true);
};

/* ---------------- MULTER SETUP ---------------- */

const upload = multer({
  storage,
  fileFilter,
});

/* ---------------- UPLOAD ROUTE ---------------- */

router.post("/", upload.single("file"), async (req, res) => {
  let filePath = "";

  try {
    /* ---------- CHECK FILE ---------- */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded",
      });
    }

    filePath = req.file.path;

    /* ---------- PARSE PDF ---------- */

    const extractedText = await parsePDF(filePath);

    if (!extractedText || extractedText.trim() === "") {
      await fs.remove(filePath);

      return res.status(400).json({
        success: false,
        error: "No readable text found in PDF",
      });
    }

    /* ---------- CREATE CHUNKS ---------- */

    const chunks = chunkText(extractedText);

    if (!chunks || chunks.length === 0) {
      await fs.remove(filePath);

      return res.status(400).json({
        success: false,
        error: "No chunks created from PDF",
      });
    }

    /* ---------- GENERATE EMBEDDINGS ---------- */

    const documentsToSave = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);

      /* ---------- DEBUG LOG ---------- */

      console.log("Embedding Length:", embedding?.length);

      documentsToSave.push({
        text: chunk,

        embedding,

        source: req.file.originalname,
      });
    }

    /* ---------- SAVE TO DATABASE ---------- */

    await Document.insertMany(documentsToSave);

    /* ---------- DELETE LOCAL FILE ---------- */

    await fs.remove(filePath);

    /* ---------- SUCCESS RESPONSE ---------- */

    res.status(200).json({
      success: true,

      message: "PDF processed and stored successfully",

      fileName: req.file.originalname,

      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    /* ---------- DELETE FILE ON ERROR ---------- */

    if (filePath) {
      try {
        await fs.remove(filePath);
      } catch (deleteError) {
        console.error("FILE DELETE ERROR:", deleteError);
      }
    }

    res.status(500).json({
      success: false,

      error: error.message || "PDF processing failed",
    });
  }
});

module.exports = router;
