const Url = {
    /**
     * 
     * @param {string} s 
     */
    GBKToUnicode(s){ 
        return s.replace(/([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/g,function(newStr){
            return "\\u" + newStr.charCodeAt(0).toString(16); 
　　　　 }); 
    },
    // url编码
    urlEncode(url){
        url = encodeURIComponent(url);
        url = url.replace(/\%3A/g, ":");
        url = url.replace(/\%2F/g, "/");
        url = url.replace(/\%3F/g, "?");
        url = url.replace(/\%3D/g, "=");
        url = url.replace(/\%26/g, "&");
        url = url.replace(/\%25/g, "%");
        return url;
    },


}
module.exports = Url;