const chunkText = (text, chunkSize = 1000) => {
  // Clean text
  const cleanedText = text.replace(/\s+/g, " ").trim();

  const chunks = [];

  for (let i = 0; i < cleanedText.length; i += chunkSize) {
    chunks.push(cleanedText.slice(i, i + chunkSize));
  }

  return chunks;
};

module.exports = chunkText;
