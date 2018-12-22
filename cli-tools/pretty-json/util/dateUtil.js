let dateUtil = {
    getRandomDateByRang(rang) {
        var date = new Date();
        date.setTime(date.getTime() - Math.random(rang) * 86400000)
        return this.formate(date);
    },

    getRandomDate() {
        return this.getRandomDateByRang(365);
    },

    formate(date) {  
        var y = date.getFullYear();  
        var m = date.getMonth() + 1;  
        m = m < 10 ? ('0' + m) : m;  
        var d = date.getDate();  
        d = d < 10 ? ('0' + d) : d;  
        var h = date.getHours();  
        var minute = date.getMinutes();  
        minute = minute < 10 ? ('0' + minute) : minute; 
        var second= date.getSeconds();  
        second = minute < 10 ? ('0' + second) : second;  
        return y + '-' + m + '-' + d+' '+h+':'+minute+':'+ second;  
    },

    getToday() {
        let day = this.formate(new Date()).substring(0, 10);
        return day;
    }

}
module.exports = dateUtil;