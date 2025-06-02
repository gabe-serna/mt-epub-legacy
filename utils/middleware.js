const { PDFNet } = require("@pdftron/pdfnet-node");
const converter = require("node-ebook-converter");
const { parse } = require("node-html-parser");
const epub = require("epub-parser");
const https = require("https");
const sharp = require("sharp");
const axios = require("axios");
const JSZip = require("jszip");
const path = require("path");
const fs = require("fs");

const rootURL =
  "C:/Users/User/OneDrive/Documentos/VSCode Projects/mushoku_tensei_pdf_formatter/";
const key =
  "demo:1718488454635:7fa2653b030000000071bb6f4b1df38eb14ce854dd03769d94ef0101b0";

module.exports.formatPDF = async function formatPDF(req, res, next) {
  const removeFooter = async () => {
    const doc = await PDFNet.PDFDoc.createFromFilePath(
      req.files.inputFile.tempFilePath
    );
    // const footer = new PDFNet.Rect(0, 0, 815, 60);
    // Normal Page: Width 612, Height 792
    // Images: Width 445.5, Height 635.25

    let pageCount = await doc.getPageCount();
    pageCount -= 6;

    //Delete Spoiler Pages
    const omittedPages = [9, 7, 4, 3, 2, 1];
    for (const pageNum of omittedPages) {
      const pageIterator = await doc.getPageIterator(pageNum);
      await doc.pageRemove(pageIterator);
    }

    //Remove Footer
    for (let i = 1; i <= pageCount; i++) {
      const replacer = await PDFNet.ContentReplacer.create();
      let page = await doc.getPage(i);
      let height = await page.getPageHeight();
      if (height < 700) {
        await replacer.addText(new PDFNet.Rect(0, 0, 445, 600), "");
      }
      await replacer.addText(new PDFNet.Rect(0, 0, 612, 60), "");
      await replacer.process(page);
      await replacer.destroy();
    }

    let fileName = req.files.inputFile.name;
    if (fileName.includes("_")) {
      let nameArray = fileName.split(" ");
      fileName =
        "Mushoku Tensei SPOILER FREE Volume " + nameArray[nameArray.length - 1];
    }
    const outputPath = path.join(rootURL, "downloads/", fileName);
    req.name = fileName;
    await doc.save(outputPath, PDFNet.SDFDoc.SaveOptions.e_linearized);
  };

  await PDFNet.runWithoutCleanup(removeFooter, key)
    .then(() => {
      console.log("PDF Formatted Successfully");
      next();
    })
    .catch(err => {
      console.log(`PDFNet Error: ${JSON.stringify(err)}\n error: ${err}`);
      return res.status(500).send("Could not Format PDF");
    });
};

module.exports.convertToEpub = async function convert(req, res, next) {
  let pdfName = req.name;
  req.pdfPath = path.join(rootURL, "downloads/", pdfName);
  let epubName = path.basename(req.pdfPath, ".pdf") + ".epub";
  req.epubPath = path.join(rootURL, "downloads/", epubName);

  await converter
    .convert({
      input: req.pdfPath,
      output: req.epubPath,
      authors: "Rifujin na Magonote"
    })
    .then(response => console.log(response))
    .catch(err => {
      console.log(`Converting Error: ${err}`);
      return res.status(500).send("Error Converting to EPUB");
    });

  console.log("converted to epub at:", req.epubPath);
  next();
};

// module.exports.scrapeCoverImage = async function scrape(req, res, next) {
//   console.log("Scraping Cover Image");
//   let nameArray = path.basename(req.pdfPath, ".pdf").split(" ");
//   let volumeNumber = nameArray[nameArray.length - 1];
//   let url;

//   //Locating Image URL
//   await axios
//     .get(`https://mushokutensei.fandom.com/wiki/Light_Novel_Volume_${volumeNumber}`)
//     .then(({ data }) => {
//       const root = parse(data);
//       const images = root.querySelectorAll(".image-thumbnail");
//       images.forEach(image => {
//         if (image["_attrs"]["title"] != "English") return;
//         url = image["_attrs"]["href"];
//       });
//     });

//   //Downloading WEBP Image
//   req.imageName = nameArray.join(" ");
//   let webpPath = path.join(rootURL, "tmp/", `${req.imageName}.webp`);

//   https.get(url, async response => {
//     if (response.statusCode === 200) {
//       fileStream = fs.createWriteStream(webpPath);
//       response.pipe(fileStream).on("error", e => {
//         console.log("Error Fetching Cover Image: ", e);
//         return res.status(500).send("Could not Fetch Cover Image");
//       });

//       //Convert Image to JPEG
//       fileStream.on("finish", async () => {
//         req.imagePath = path.join(rootURL, "tmp/", `${req.imageName}.jpg`);
//         const buffer = await fs.promises.readFile(webpPath);
//         await sharp(buffer).toFormat("jpeg").toFile(req.imagePath);
//         console.log("Finished Converting Image to JPG");
//         next();
//       });
//     } else {
//       return res.status(500).send("Could Not Fetch Cover Image");
//     }
//   });
// };

// module.exports.addCoverImage = async function coverImage(req, res, next) {
//   console.log("(Not) Adding Cover Image to EPUB");

//   return new Promise((resolve, reject) => {
//     epub.open(req.epubPath, async (err, data) => {
//       if (err) {
//         console.log("Error Adding Cover Image: ", err);
//         reject("Error Adding Cover Image");
//         return;
//       }
//       let coverImagePath = data.easy["itemHashById"]["cover"]["$"]["href"];

//       const epubBuffer = await fs.promises.readFile(req.epubPath);
//       const zip = await JSZip.loadAsync(epubBuffer);
//       const newCoverBuffer = await fs.promises.readFile(req.imagePath);

//       zip.file(coverImagePath, newCoverBuffer);
//       const newEpubBuffer = await zip.generateAsync({ type: "nodebuffer" });
//       req.finalPath = path.join(rootURL, "downloads/", `${req.imageName}.epub`);
//       await fs.promises.writeFile(req.finalPath, newEpubBuffer);

//       resolve("(Not) Epub Cover Added Successfully");
//     });
//   })
//     .then(message => {
//       console.log(message);
//       next();
//     })
//     .catch(error => {
//       return res.status(400).send(error);
//     });
// };
