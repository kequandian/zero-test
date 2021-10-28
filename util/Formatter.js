
let fs = require('fs');
let Formatter = {
    blankReplace : 'nbsp',
    /**
     * --filter='{}' 格式中的空格转换成其他字符
     * @param {*} str 
     */
    replaceFilterBlank(str) {
        if(str.indexOf('--filter=') >= 0) {
            let constant = str.substring(0, str.indexOf('--filter='));
            let help = str.substring(str.indexOf('--filter='));
            let start = help.indexOf("{");
            let end = help.substring(start).indexOf("}") + start + 1;
            let filter = help.substring(start, end);
            let others = help.substring(end);
            filter = filter.replace(/\\\"[\s]*:[\s]*([\\\"]*)/g,'\\\":$1')  //remove space beside ':'
                           .replace(/([\\\"]*)[\s]*,[\s]*\\\"/g,'$1,\\\"')  //remove space beside ','
                           .replace(new RegExp(' ', 'g'), this.blankReplace);  // last replace space within " "
                           //.replace(/\\\"/g, "\"")     // replace \\\" -> \"

            //str = constant + " --filter='" + filter  + '\'' + others;
            str = constant + " --filter=" + filter + others;
        }
        return str;
    }   
}
module.exports = Formatter;
