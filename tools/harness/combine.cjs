const { chromium } = require('playwright'); const fs=require('fs');
const [out,...imgs]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:964,height:100}});
await p.setContent('<body style="margin:0;background:#222;display:grid;grid-template-columns:480px 480px;gap:4px">'+imgs.map(f=>'<img src="data:image/png;base64,'+fs.readFileSync(f).toString('base64')+'" style="width:480px">').join('')+'</body>');
await p.screenshot({path:out,fullPage:true});await b.close();})();
