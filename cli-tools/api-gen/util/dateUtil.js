let dateUtil = {
    getRandomDateByRang(rang) {
        var date = new Date();
        date.setTime(date.getTime() - Math.round(Math.random() * rang * 24 * 60 * 60 * 1000)  );
        return this.formate(date);
    },

    getRandomDate() {
        return this.getRandomDateByRang(365);
    },
    getNow() {
        var now = new Date();
        return this.formate(now);
    },
    /**
     * 获取day天前后00:00:00 时间, 负数即几天前
     * @param {*} day 
     */
    getDA(day) {
        return this.formateDay(this.getDate(day)) + " 00:00:00";
    },
    getDP(day) {
        return this.formateDay(this.getDate(day)) + " 23.59.59";
    },
    getD(day) {
        return this.formate(this.getDate(day));
    },
    getDate(day) {
        var date = new Date();
        date.setTime(date.getTime() + day * 24 * 60 * 60 * 1000);
        return date;
    },
    formate(date) {
        var y = date.getFullYear();  
        var m = date.getMonth() + 1;  
        m = m < 10 ? ('0' + m) : m;  
        var d = date.getDate();  
        d = d < 10 ? ('0' + d) : d;  
        var h = date.getHours();
        h = h < 10 ? ('0' + h) : h;
        var minute = date.getMinutes();  
        minute = minute < 10 ? ('0' + minute) : minute; 
        var second= date.getSeconds();  
        second = second < 10 ? ('0' + second) : second;  
        return y + '-' + m + '-' + d+' '+h+':'+minute+':'+ second;  
    },
    formateDay(date) {
        var y = date.getFullYear();  
        var m = date.getMonth() + 1;  
        m = m < 10 ? ('0' + m) : m;  
        var d = date.getDate();  
        d = d < 10 ? ('0' + d) : d;  
        return y + '-' + m + '-' + d;  
    }
}
module.exports = dateUtil;