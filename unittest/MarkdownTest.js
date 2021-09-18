var markdownpdf = require("markdown-pdf")
var fs = require("fs")
 
// fs.createReadStream("/path/to/document.md")
//   .pipe(markdownpdf())
//   .pipe(fs.createWriteStream("/path/to/document.pdf"))
 
var inputPath = `${process.cwd()}/unittest/markdown/testcase.md`
var outputPath= `${process.cwd()}/unittest/markdown/testcase.pdf`

markdownpdf().from(inputPath).to(outputPath, function () {
  console.log("Done")
})