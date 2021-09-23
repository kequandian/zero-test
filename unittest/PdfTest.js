var dir = `${process.cwd()}`
if(dir.endsWith('unittest')){
    console.log("should be run outside unittest !")
    return
}

var markdownpdf = require("markdown-pdf")

let Pdf = {
    options : {
        cssPath : `${dir}/unittest/markdown/markdown.css`,
        paperFormat : "A1"
    },
    export(inputFile, outputFile) {
        if(outputFile == undefined || outputFile == "") {
            outputFile = "default.pdf";
        }
        console.log(`converting pdf from ${inputFile} to ${outputFile}.pdf`);
        markdownpdf(this.options)
        .from(inputFile)
        .to(outputFile, function () {
            console.log("Done")
        })
    }
}

console.log(`${dir}/unittest/markdown/testcase.md`, `${dir}/unittest/markdown/testcase.pdf`)
Pdf.export(`${dir}/unittest/markdown/testcase.md`, `${dir}/unittest/markdown/testcase.pdf`)
