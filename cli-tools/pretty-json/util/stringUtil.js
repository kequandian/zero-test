let StringUtil = {
    /**
     * 自动换行
     */
    wordWrap(string, lineSize) {
        if(lineSize && lineSize > 0) {
            string = JSON.stringify(string);
            if(string[0] == '"' && string[string.length - 1] == '"') {
                string = string.substring(1, string.length - 1);
            }
            let result = "";
            let whileIndex = 0;
            do {
                if(whileIndex > 0) {
                    result += "\n";
                }
                result += string.substring(0, lineSize);
                string = string.substring(lineSize);
                whileIndex ++;
            } while(string.length > 0);
            return result;
        }
        return string;
    }
}

module.exports = StringUtil;