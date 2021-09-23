const mdpdf = require('mdpdf');
const path = require('path');

// let options = {
//   source: path.join(__dirname, 'markdown/testcase.md'),
//   destination: path.join(__dirname, 'output.pdf'),
//   styles: path.join(__dirname, 'markdown/markdown.css'),
//   pdf: {
//       format: 'A4',
//       orientation: 'portrait'
//   }
// };

let Pdf = {
    options : {
        //source: path.join(__dirname, 'markdown/testcase.md'),
        destination: path.join(__dirname, 'default.pdf'),
        styles: path.join(path.dirname(__dirname), 'test-env/pub/markdown.css'),
        pdf: {
            format: 'A4',
            orientation: 'portrait'
        }
    },

    export(inputFile, outputFile) {
        options.source = inputFile

        if (outputFile==undefined || outputFile == "") {
            options.destination = path.join(path.dirname(inputFile), path.basename(inputFile)+".pdf")
        }

        console.log(`converting pdf from ${inputFile} to ${outputFile}`);
        mdpdf.convert(options).then((pdfPath) => {
            console.log('PDF Path:', pdfPath);
        }).catch((err) => {
            console.error(err);
        });
    }
}

module.exports = Pdf;


