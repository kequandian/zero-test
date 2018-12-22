const fs = require('fs');

const [ nodePath, scriptPath, jsonString ] = process.argv;

var result = JSON.parse(jsonString);


//////////////////////////////////////////
Date.prototype.pattern=function(fmt) {
//fmt = fmt.replace(/HH/g, "\xa0HH");
//fmt = fmt.replace(/hh/g, "\xa0hh");

var o = {
"M+" : this.getMonth()+1, //月份
"d+" : this.getDate(), //日
"h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时
"H+" : this.getHours(), //小时
"m+" : this.getMinutes(), //分
"s+" : this.getSeconds(), //秒
"q+" : Math.floor((this.getMonth()+3)/3), //季度
"S" : this.getMilliseconds() //毫秒
};
var week = {
"0" : "/u65e5",
"1" : "/u4e00",
"2" : "/u4e8c",
"3" : "/u4e09",
"4" : "/u56db",
"5" : "/u4e94",
"6" : "/u516d"
};

if(/(y+)/.test(fmt)){
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
}

if(/(E+)/.test(fmt)){
    fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);
}

for(var k in o){
   if(new RegExp("("+ k +")").test(fmt)){
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr( (""+ o[k]).length )));
   }
}

return fmt;
}
////////////////////////////////////////////



var filter = {};
//filter["updateTime"] = new Date().pattern("yyyy-MM-dd\xa0HH:mm:ss");
//filter["endTime"] = new Date().pattern("yyyy-MM-dd\xa0HH:mm:ss");
//filter["createTime"] = new Date().pattern("yyyy-MM-dd\xa0HH:mm:ss");


/// iter filter
for(let itemKey of Object.keys(result)){
   if(itemKey.match(/\w+Time/)){
      filter[itemKey] = new Date().pattern("yyyy-MM-dd\xa0HH:mm:ss");
      result[itemKey] = filter[itemKey];
   }else if(itemKey.match(/\w+Date/)){
      filter[itemKey] = new Date().pattern("yyyy-MM-dd");
      result[itemKey] = filter[itemKey];
   }else if(itemKey.match(/status/)){
      result[itemKey] = "Draft"
   } 

   //if(result.hasOwnProperty(itemKey)){
   //   result[itemKey] = filter[itemKey];
   //}
}

console.log(JSON.stringify(result));


