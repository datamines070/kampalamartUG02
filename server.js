const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json({limit:'10mb'}));
app.use(function(req,res,next){ res.set('Cache-Control','no-store, no-cache, must-revalidate'); res.set('Pragma','no-cache'); next(); });
const DATA_FILE = path.join(__dirname, 'data.json');
let MEMORY = {keys:{}, updatedAt:0, data:{products:[], banners:[], categories:[], locations:[], ownerNotifs:[], ads:{}, feeNote:''}};
try{
  if(fs.existsSync(DATA_FILE)){
    var raw = fs.readFileSync(DATA_FILE,'utf8');
    var j = JSON.parse(raw);
    if(j.keys) MEMORY.keys = j.keys;
    if(j.updatedAt) MEMORY.updatedAt = j.updatedAt;
    if(j.data && j.data.products) MEMORY.data = j.data;
    else if(j.keys && j.keys['km_db_v63']){ try{ MEMORY.data = JSON.parse(j.keys['km_db_v63']); }catch(e){} }
    console.log('Loaded data.json, updatedAt='+MEMORY.updatedAt+', products='+(MEMORY.data.products||[]).length);
  }
}catch(e){ console.log('data.json load err', e.message); }
function persist(){ try{ fs.writeFileSync(DATA_FILE, JSON.stringify({keys:MEMORY.keys, updatedAt:MEMORY.updatedAt, data:MEMORY.data}, null, 2)); }catch(e){} }
function setData(newData){
  if(!newData) return;
  // newData is {products, banners, ads, categories, locations, ...} - keep it whole
  MEMORY.data = Object.assign({}, MEMORY.data, newData);
  if(newData.products) MEMORY.data.products = newData.products;
  // Keep keys in sync so V68 /api poll also sees it
  MEMORY.keys['km_db_v63'] = JSON.stringify(MEMORY.data);
  MEMORY.updatedAt = Date.now();
  persist();
}
// --- /api/data (V68 sync) ---
app.get('/api/data', function(req,res){ res.json({keys:MEMORY.keys, data:MEMORY.data, updatedAt:MEMORY.updatedAt}); });
app.post('/api/data', function(req,res){
  var b = req.body||{};
  if(b.keys){ Object.keys(b.keys).forEach(function(k){ MEMORY.keys[k]=b.keys[k]; }); try{ if(b.keys['km_db_v63']) MEMORY.data = JSON.parse(b.keys['km_db_v63']); }catch(e){} if(b.data) setData(b.data); else { MEMORY.updatedAt = Date.now(); persist(); } }
  else if(b.data) setData(b.data);
  else if(b.products) setData(b);
  res.json({ok:true, updatedAt:MEMORY.updatedAt, products:(MEMORY.data.products||[]).length});
});
// --- /rest/v1/km_data (React's own cloud - THIS is what the shop actually uses) ---
// React does: GET /rest/v1/km_data?id=eq.1&select=data  -> expects [{data:{products...}}]
// React does: POST /rest/v1/km_data?on_conflict=id with {id:1, data:{products...}} -> must save
app.get('/rest/v1/km_data', function(req,res){ res.json([{id:1, data:MEMORY.data}]); });
app.post('/rest/v1/km_data', function(req,res){
  var b = req.body||{};
  var d = b.data || b;
  if(d && (d.products || d.banners || d.ads)) setData(d);
  else if(b.keys) { /* V68 style */ }
  res.json([{id:1, data:MEMORY.data}]);
});
// Also handle PATCH/PUT for Supabase-style upsert
app.patch('/rest/v1/km_data', function(req,res){ var b=req.body||{}; if(b.data) setData(b.data); res.json([{id:1, data:MEMORY.data}]); });
app.put('/rest/v1/km_data', function(req,res){ var b=req.body||{}; if(b.data) setData(b.data); res.json([{id:1, data:MEMORY.data}]); });
app.get('/api/health', function(req,res){ res.json({ok:true, updatedAt:MEMORY.updatedAt, products:(MEMORY.data.products||[]).length, keys:Object.keys(MEMORY.keys)}); });
function serveIndex(req,res){
  var p1 = path.join(__dirname,'public','index.html');
  var p2 = path.join(__dirname,'index.html');
  var file = fs.existsSync(p1)?p1:(fs.existsSync(p2)?p2:null);
  if(!file) return res.status(404).send('<h1>Kampala Mart is Live</h1><p>index.html not found. Upload index.html to GitHub root.</p>');
  try{
    var content = fs.readFileSync(file,'utf8');
    var inject = '<script>window.__SERVER_DB__=' + JSON.stringify({keys:MEMORY.keys, data:MEMORY.data}) + ';window.__SERVER_UPDATED_AT__=' + MEMORY.updatedAt + ';</script>';
    if(content.indexOf('</head>')!==-1) content = content.replace('</head>', inject + '</head>');
    else content = inject + content;
    res.set('Content-Type','text/html');
    res.send(content);
  }catch(e){ res.sendFile(file); }
}
app.get('/', serveIndex);
app.get('/index.html', serveIndex);
app.use(express.static(path.join(__dirname,'public'), {index:false, maxAge:0}));
app.use(express.static(__dirname, {index:false, maxAge:0}));
app.get('*', function(req,res){
  if(req.path.indexOf('/api')===0 || req.path.indexOf('/rest')===0) return res.status(404).json({error:'not found'});
  return serveIndex(req,res);
});
app.listen(PORT, function(){ console.log('Kampala Mart Render server on '+PORT+' - V69 Real Origin Fixed'); });
