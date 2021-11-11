cd pdf-cli
if [ ! -d "node_modules" ]
then 
echo "未安装工具 正在安装"
npm i
npm start
else npm start
fi