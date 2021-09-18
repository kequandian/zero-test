var markdownpdf = require("markdown-pdf")

let Pdf = {
    options : {
        cssPath : `${process.cwd()}/unittest/markdown/markdown.css`,
        paperFormat : "A1"
    },
    export(inputFile, outputFile) {
        if(outputFile == undefined || outputFile == "") {
            outputFile = "default.pdf";
        }
        console.log('outputFile=', outputFile)
        console.log(`converting pdf from ${inputFile} to ${outputFile}.pdf`);
        markdownpdf(this.options).from('test-env/pub/logs/testcase').to(outputFile, function () {
            console.log("Done")
        })
    }
}

console.log(`${process.cwd()}/unittest/markdown/testcase.md`, `${process.cwd()}/unittest/markdown/testcase.pdf` )
Pdf.export(`${process.cwd()}/unittest/markdown/testcase.md`, `${process.cwd()}/unittest/markdown/testcase.pdf`)
