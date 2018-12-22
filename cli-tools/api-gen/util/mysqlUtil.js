let mysql = require('mysql');//引入mysql模块
var databaseConfig = require('../../../server.config');  //引入数据库配置模块中的数据


module.exports = {
    query : function(sql, callback){
        var connection = mysql.createConnection(databaseConfig.mysql);        
        connection.connect(function(err){
            if(err){
                console.log('mysql createConnection err: ' + err.message);
                throw err;
            }
        connection.query( sql, function(err,results,fields ){
           if(err){
                console.log('mysql query err: ' + err.message);
                throw err;
            }
            callback && callback(results, fields);
            connection.end(function(err){
                  if(err){
                    console.log('mysql close err: ' + err.message);
                    throw err;
                  }
              });
           });
       });
    }
};