let fs = require("fs");
let DateUtil = require("./dateUtil");

let StringUtil = {
    random(len) {
        let max = Math.round(len * Math.random());
        let fonts = JSON.parse(fs.readFileSync("fonts.json", "UTF-8"));
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
    },
    /**
     * 替换json对象中的占位符, 只支持个位天数 -9 ~ 9
     * $2D  表示现在时间2天前
     * $2DA 表示现在时间2天前 00:00:00 
     * $2DP 表示现在时间2天前 23.59.59
     * $CUR currnet_time
     * @param {string} str 
     */
    replacePlaceholder(str) {
        let index;
        str = str.replace(new RegExp(/#CUR/, "g"), DateUtil.getNow());
        while((index = str.search(/#[0-9]+DA/)) != -1) {
            let day = str.substring(index + 1, index +2);
            str = str.replace(/#[0-9]+DA/, DateUtil.getDA(day));
        }
        while((index = str.search(/#[0-9]+DP/)) != -1) {
            let day = str.substring(index + 1, index + 2);
            str = str.replace(/#[0-9]+DP/, DateUtil.getDP(day));
        }
        while((index = str.search(/#-[0-9]+DA/)) != -1) {
            let day = str.substring(index + 1, index + 3);
            str = str.replace(/#-[0-9]+DA/, DateUtil.getDA(day));
        }
        while((index = str.search(/#-[0-9]+DP/)) != -1) {
            let day = str.substring(index + 1, index + 3);
            str = str.replace(/#-[0-9]+DP/, DateUtil.getDP(day));
        }
        return str;
    },
    
        /**
     * 替换json对象中的占位符且对空格进行替换(%20), 只支持个位天数 -9 ~ 9
     * $2D  表示现在时间2天前
     * $2DA 表示现在时间2天前 00:00:00 
     * $2DP 表示现在时间2天前 23.59.59
     * $CUR currnet_time
     * @param {string} str 
     */
    replacePlaceholderByEncode(str) {
        let index;
        str = str.replace(new RegExp(/#CUR/, "g"), DateUtil.getNow().replace(" ", "%20"));
        while((index = str.search(/#[0-9]+DA/)) != -1) {
            let day = str.substring(index + 1, index +2);
            str = str.replace(/#[0-9]+DA/, DateUtil.getDA(day).replace(" ", "%20"));
        }
        while((index = str.search(/#[0-9]+DP/)) != -1) {
            let day = str.substring(index + 1, index + 2);
            str = str.replace(/#[0-9]+DP/, DateUtil.getDP(day).replace(" ", "%20"));
        }
        while((index = str.search(/#-[0-9]+DA/)) != -1) {
            let day = str.substring(index + 1, index + 3);
            str = str.replace(/#-[0-9]+DA/, DateUtil.getDA(day).replace(" ", "%20"));
        }
        while((index = str.search(/#-[0-9]+DP/)) != -1) {
            let day = str.substring(index + 1, index + 3);
            str = str.replace(/#-[0-9]+DP/, DateUtil.getDP(day).replace(" ", "%20"));
        }
        return str;
    }
}


module.exports = StringUtil;