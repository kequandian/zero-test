const mdpdf = require('mdpdf');
const path = require('path');

let options = {
  source: path.join(__dirname, 'markdown/testcase.md'),
  destination: path.join(__dirname, 'output.pdf'),
  styles: path.join(__dirname, 'markdown/markdown.css'),
  pdf: {
      format: 'A4',
      orientation: 'portrait'
  }
};

mdpdf.convert(options).then((pdfPath) => {
  console.log('PDF Path:', pdfPath);
}).catch((err) => {
  console.error(err);
});
