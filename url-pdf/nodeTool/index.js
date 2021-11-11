let koa = require("koa")
let koaBody = require("koa-body")
let route = require("koa-route")
let app = new koa()
let path = require("path")
let fs = require("fs")
let config = require("./config")
app.use(koaBody())

// let html = require('./dist/index.html')
// let json = require("./json/setting.json")

// 写入JSON地址
let jsonAddress = "./json/setting.json"

app.use(async (ctx, next)=> {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (ctx.method == 'OPTIONS') {
      ctx.body = 204; 
    } else {
      await next();
    }
  });

app.use(route.post("/setPageJson",async(ctx)=>{
    let body = ctx.request.body
    let res = await new Promise((resolve)=>{
      fs.writeFile(path.resolve(jsonAddress),JSON.stringify(body),(err)=>{
        if(err) resolve({code:500,msg:"写入失败"})  
        else resolve({code:200,msg:"写入成功",data:body})  
      })
    })
    ctx.response.body = res
}))

app.use(route.get("/getPageJson",async(ctx)=>{
    let json = fs.readFileSync(path.resolve(jsonAddress))
    ctx.body = json
}))
app.listen(config.port)
console.log("服务器开启 端口是"+config.port)