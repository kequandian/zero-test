var shell = require("shelljs");
let Path = {
    path : process.cwd(),

    /**
     * 
     * @param {string} path 
     */
    save(path) {
        this.path = path.replace(new RegExp(/\\/, 'g'), "/");
    },

    cd() {
        shell.cd(this.path);
    }
}

module.exports=Path;