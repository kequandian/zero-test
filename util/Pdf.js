var markdownpdf = require("markdown-pdf")

let Pdf = {
    options : {
        cssPath : "pub/markdown.css",
        paperFormat : "A1"
    },
    export(inputFile, outputFile) {
        console.log(`converting pdf from ${inputFile} to ${outputFile}`);
        markdownpdf(this.options).from(inputFile).to(outputFile, function () {
            console.log("Done")
        })
    }
}

module.exports = Pdf;


