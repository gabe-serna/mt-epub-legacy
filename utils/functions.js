const fs = require("fs");
const path = require("path");

module.exports.deleteTempFiles = function deleteTempFiles() {
  let directory =
    "C:/Users/User/OneDrive/Documentos/VSCode Projects/mushoku_tensei_pdf_formatter/tmp";
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.log("Could not clear temp file path.", err);
      return;
    }
    files.forEach(file => {
      fs.unlink(path.join(directory, file), err => {
        if (err) {
          console.log(`Error deleting file: ${file}`, err);
        } else {
          // console.log(`Deleted file: ${file}`);
        }
      });
    });
  });
};
