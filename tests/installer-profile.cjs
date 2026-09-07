const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os'),{resolveProfile}=require('../scripts/installer.cjs');
const appData=path.join(os.tmpdir(),'fixture-roaming');
assert.equal(resolveProfile(null,appData),path.join(appData,'Codex'));
console.log('PASS First install follows the supported package nonvirtualized roaming profile');
const existing=path.join(os.tmpdir(),'existing-custom-profile');assert.equal(resolveProfile({Profile:existing},appData),existing);
console.log('PASS An existing installation keeps its explicit absolute profile path');
for(const value of ['',null,17,'relative/profile'])assert.equal(resolveProfile({Profile:value},appData),path.join(appData,'Codex'));
console.log('PASS Invalid stored profile paths fall back without using a package cache');
