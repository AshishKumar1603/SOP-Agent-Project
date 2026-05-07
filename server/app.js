const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const uploadRoute = require("./routes/upload");
const queryRoute = require("./routes/query");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoute);
app.use("/query", queryRoute);

app.get("/", (req, res) => {
  res.send("SOP Agent Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
