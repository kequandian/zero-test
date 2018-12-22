const ora = require('ora');
const download = require('download-git-repo');

module.exports = function (name, path) {
  const spinner = ora(`正在 clone 项目 ${name}`).start();

  return cloneGit(name, path).then((msg) => {
    spinner.succeed(msg);
    return path;
  }).catch((err) => {
    spinner.fail(err);
    return err;
  });
}
function cloneGit(name, path) {
  return new Promise((res, rej) => {
    download(
      name,
      path,
      function (err) {
        if (err) {
          rej(err);
        } else {
          res(`模板 ${name} clone 完成`);
        }
      }
    );
  })
}