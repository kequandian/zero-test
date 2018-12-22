var db = require('./util/mysqlUtil');
// 查询实例
db.query('DESCRIBE t_sys_org', function(result,fields){
    console.log('查询结果：');
    console.log(result);
});