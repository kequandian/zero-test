let fs = require("fs");

let StringUtil = {
    random(len) {
        let max = Math.round(len * Math.random());
        let fonts = JSON.parse(fs.readFileSync("fonts.json"));
        let text = "";
        for(let i = 0; i < max; i++) {
            text = text + fonts[Math.round(Math.random(fonts.length) * fonts.length)];
        }
        return text;
    },
    underlineToUpCase(str) {
        if(!str) return;
        str = str.split("_");
        let result = "";
        for(let item in str) {
            if(item > 0) {
                result += str[item][0].toUpperCase() + (str[item].length > 1 ? str[item].substring(1) : "");
            } else {
                result += str[item];
            }
            
        }
        return result;
    }
}


module.exports = StringUtil;