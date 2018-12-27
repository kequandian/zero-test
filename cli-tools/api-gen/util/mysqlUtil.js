let mysql = require('mysql');//引入mysql模块
let databaseConfig = require('../../../conf/server.config');  //引入数据库配置模块中的数据
let shelljs = require('shelljs');

module.exports = {
    query : function(sql, callback){
        try {
            var connection = mysql.createConnection(databaseConfig.mysql);        
            connection.connect(function(err){
                if(err){
                    console.log('mysql createConnection err: ' + err.message);
                    //throw err;
                    shelljs.exit(1);
                }
            connection.query( sql, function(err,results,fields ){
               if(err){
                    console.log('mysql query err: ' + err.message);
                    //throw err;
                    shelljs.exit(1);
                }
                callback && callback(results, fields);
                connection.end(function(err){
                      if(err){
                        console.log('mysql close err: ' + err.message);
                      //  throw err;
                        shelljs.exit(1);
                      }
                  });
               });
           });
        } catch(err) {
            console.log(`mysql execute error: ${err.message}`);
            shelljs.exit(1);
        }

    }
};