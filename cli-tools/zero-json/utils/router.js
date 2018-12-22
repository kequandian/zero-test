
const fs = require('fs');
const fsExtra = require('fs-extra');

/**
 * 
 * @param {string} routerFilePath 路由文件的绝对路径
 */
const router = function (routerFilePath) {
  if (!fs.existsSync(routerFilePath)) {
    console.log('未能找到路由文件:', routerFilePath);
    throw new Error('未能找到路由文件');
  }
  delete require.cache[routerFilePath];
  const routerEntity = require(routerFilePath);
  return {
    check: function (pageName) {
      return routerEntity.some(route => {
        if (route.path === '/') {
          return route.routes.some(item => {
            if (item.name === pageName) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    },
    // 添加新的页面级路由
    add: function (pathObject) {
      routerEntity.some(route => {
        // 找到菜单的路由项
        if (route.path === '/') {
          route.routes.splice(-2, 0, pathObject);
          return true;
        }
        return false;
      });

      return fsExtra.outputFile(
        routerFilePath,
        'module.exports = ' + JSON.stringify(routerEntity, null, 2)
      );
    },
    append: function (pageName, pathObject) {
      routerEntity.some(route => {
        // 找到菜单的路由项
        if (route.path === '/') {
          route.routes.forEach(item => {
            if (item.name === pageName) {
              item.routes.splice(-1, 0, pathObject);
            }
          })
          return true;
        }
        return false;
      })

      return fsExtra.outputFile(
        routerFilePath,
        'module.exports = ' + JSON.stringify(routerEntity, null, 2)
      );
    }
  }
}
module.exports = router;