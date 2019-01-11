var markdownpdf = require("markdown-pdf")
var root = require("../static/root.config");

let Pdf = {
    options : {
        cssPath : `${root}/pub/markdown.css`,
        paperFormat : "A1"
    },
    export(inputFile, outputFile) {
        if(outputFile == undefined || outputFile == "") {
            outputFile = "default.pdf";
        }
        console.log(`converting pdf from ${inputFile} to ${outputFile}`);
        markdownpdf(this.options).from(inputFile).to(outputFile, function () {
            console.log("Done")
        })
    }
}

module.exports = Pdf;


