const { chromium, devices } = require('playwright'); const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2];
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];const p=path.join(root,decodeURIComponent(u));fs.readFile(u.endsWith('/')?path.join(p,'index.html'):p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':{'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'}[path.extname(u.endsWith('/')?'x.html':p)]||'application/octet-stream'});r.end(d);});});
srv.listen(0,async()=>{const b=await chromium.launch({ args: process.env.SWGL ? ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] : [] });
for (const [name,q] of JSON.parse(process.argv[3])) {
const d=devices['iPhone 13 landscape']; const c=await b.newContext({...d,deviceScaleFactor:1}); const p=await c.newPage(); p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:'+srv.address().port+'/v2/'+q); await p.waitForFunction(()=>window.SD2&&window.SD2.world,null,{timeout:120000});
await p.touchscreen.tap(300,200); await new Promise(r=>setTimeout(r,14000)); await p.screenshot({path:'/tmp/claude-0/-home-user/49b909d9-4871-58a5-8100-9c2b91fba04e/scratchpad/'+name+'.png'}); await c.close();}
await b.close(); srv.close();});
