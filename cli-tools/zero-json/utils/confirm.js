
const co = require('co');
const { confirm: coConfirm } = require('co-prompt');

/**
 * 要求确认以执行下一步操作
 *
 * @param {boolean} boolean 是否启用 confirm
 * @param {function} func 用户输入 yes，或者使用 --direct 参数的时候的操作
 * @param {object} options
 * @returns
 */
module.exports = function confirm(boolean, func, options = {}) {
  const { direct, message = '确定要继续吗？' } = options;

  co(function* () {
    if(boolean){
      if (direct === false) {
        const ok = yield coConfirm(`${message}[y/n]`);
        if (!ok) {
          process.exit();
          return false;
        }
      }
    }
    func();
  })
}