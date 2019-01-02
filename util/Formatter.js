
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
            let start = help.indexOf("'{");
            let end = help.substring(start).indexOf("}'") + start;
            let filter = help.substring(start, end);
            let others = help.substring(end);
            filter = filter.replace(new RegExp(' ', 'g'), this.blankReplace);
            str = constant + filter + others;
        }
        return str;
    }   
}
module.exports = Formatter;
