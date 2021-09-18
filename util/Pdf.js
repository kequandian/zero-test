var markdownpdf = require("markdown-pdf")
//var root = require("../static/root.config");

let Pdf = {
    options : {
        //cssPath : `${root}/test-env/pub/markdown.css`,
        cssPath : `./test-env/pub/markdown.css`,
        paperFormat : "A1"
    },
    export(inputFile, outputFile) {
        if(outputFile == undefined || outputFile == "") {
            outputFile = "default.pdf";
        }
        console.log(`converting pdf from ${inputFile} to ${outputFile}.pdf`);
        markdownpdf(this.options).from('test-env/pub/logs/testcase').to(outputFile, function () {
            console.log("Done")
        })
    }
}

module.exports = Pdf;


