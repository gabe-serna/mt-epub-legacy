const express = require("express");
const fileUpload = require("express-fileupload");
const {
  formatPDF,
  convertToEpub,
  scrapeCoverImage,
  addCoverImage
} = require("./utils/middleware.js");
const { deleteTempFiles } = require("./utils/functions.js");

const app = express();
const port = 4200;

app.use(express.static("public"));
app.use(
  fileUpload({
    useTempFiles: true
  })
);

app.post(
  "/pdf-to-epub",
  formatPDF,
  convertToEpub,
  scrapeCoverImage,
  addCoverImage,
  async (req, res) => {
    try {
      deleteTempFiles();
      console.log("Conversion Finished!");
      res.sendFile(
        "C:/Users/User/OneDrive/Documentos/VSCode Projects/mushoku_tensei_pdf_formatter/public/success.html"
      );
    } catch (err) {
      console.warn(`Error processing PDF: ${err.message}`);
      res.status(500).send("An error occurred while processing the PDF.");
    }
  }
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
