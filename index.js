const express = require("express");
const fileUpload = require("express-fileupload");
const {
  formatPDF,
  convertToEpub,
  scrapeCoverImage,
  addCoverImage
} = require("./utils/middleware.js");
const { deleteTempFiles } = require("./utils/functions.js");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 4200;

app.use(express.static("public"));
app.use(
  fileUpload({
    useTempFiles: true
  })
);

app.post("/pdf-to-epub", formatPDF, convertToEpub, async (req, res) => {
  try {
    if (!fs.existsSync(req.epubPath)) {
      console.error("EPUB file not found:", req.epubPath);
      return res.status(500).send("EPUB file not generated.");
    }

    deleteTempFiles();
    console.log("Conversion Finished!");
    res.sendFile(path.join(__dirname, "public", "success.html"));
  } catch (err) {
    console.warn(`Error processing PDF: ${err.message}`);
    res.status(500).send("An error occurred while processing the PDF.");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
