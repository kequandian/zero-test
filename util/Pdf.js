//const { fstat } = require('fs');
const mdpdf = require('mdpdf');
const fs = require('fs');
const path = require('path');

let options = {
  source: path.join(path.dirname(__dirname),'unittest','markdown', 'testcase.md'),
  destination: path.join(path.dirname(__dirname),'unittest','markdown', 'testcase.pdf'),
  styles: path.join(path.dirname(__dirname), 'public', 'css', 'markdown.css'),
  pdf: {
      format: 'A1',
      orientation: 'portrait'
  }
};

let Pdf = {
    options : options,

    export(inputFile, outputFile) {
        options.source = inputFile
        if (outputFile==undefined || outputFile  == '') {
            options.destination = path.join(path.dirname(inputFile), path.basename(inputFile)+".pdf")
        }else{
            if(!fs.existsSync(path.dirname(outputFile))){
                // the same path as source
               options.destination = path.join(path.dirname(inputFile), outputFile)
            }else{
               options.destination =path.resolve(outputFile)
            }
        }

        // start convert to pdf
        console.log(`converting pdf from ${options.source} to ${options.destination}`);
        mdpdf.convert(options).then((pdfPath) => {
            console.log('PDF Path:', pdfPath);
        }).catch((err) => {
            console.error(err);
        });
    }
}

module.exports = Pdf;


