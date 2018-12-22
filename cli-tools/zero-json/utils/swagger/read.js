
const fs = require('fs');
const fsExtra = require('fs-extra');
const format = require('./format');
const shell = require('shelljs');

module.exports = function read(API) {
  return new Promise((res, rej) => {
    if (API === undefined) {
      rej('请传入需要读取的 API');
    }
    const path = `${__dirname}/../../swagger/format.json`;
    if (!fs.existsSync(path)) {
      format().then(() => {
        readAPI(path, API).then(res).catch(rej);
      })
    } else {
      readAPI(path, API).then(res).catch(rej);
    }
  }).catch( (err) => {
    return err;
  });

}

function readAPI(path, API) {
  return fsExtra.readJSON(path).then((jsonData) => {
    const match = jsonData[API];
    if(match){
      return match;
    }else{
      throw new Error(`未能在 format.json 里面找到 ${API} 相关的数据`);
    }
  });
}