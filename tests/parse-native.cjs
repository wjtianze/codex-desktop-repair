const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../build/fixtures/render/patches');
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.js'))){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 // Force module grammar: .js auto-detection can fall back to a different parse mode.
 const result=cp.spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8',maxBuffer:4*1024*1024});
 assert.equal(result.status,0,file+': '+(result.stderr||'').slice(-700));
}
console.log('PASS Every complete patched native module parses under explicit module grammar');
