import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {openStore} from '../server/store.js';
import {createApp} from '../server/app.js';

const record={product:'React',vendor:'Meta',version:'19.2.0',category:'Framework',environment:'Production',priority:'High',notes:'Lab example, manually entered.'};
for(const provider of ['sqlite','mongo']) test(`${provider}: HTTP CRUD, search, validation and persistence`,async()=>{
  let mongo,store,server;
  const directory=await mkdtemp(join(tmpdir(),'vulnwatch-lab7-'));
  try {
    if(provider==='mongo') mongo=await MongoMemoryServer.create({binary:{version:'8.0.17',downloadDir:join(process.cwd(),'data','mongodb-binaries')}});
    const options={sqlitePath:join(directory,'test.db'),mongoUri:mongo?.getUri('lab7')};
    store=await openStore(provider,options);
    server=createApp(store).listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}/api`;
    const call=(path,method='GET',data)=>fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
    assert.equal((await (await call('/health')).json()).database,provider);
    assert.equal((await call('/software','POST',{})).status,400);
    assert.equal((await call('/software','POST',{...record,priority:'Invalid'})).status,400);
    let response=await call('/software','POST',record);assert.equal(response.status,201);
    const created=await response.json();assert.ok(created.id);
    assert.equal((await (await call('/software')).json()).length,1);
    assert.equal((await (await call('/software?q=REACT')).json()).length,1);
    assert.equal((await (await call('/software?q=missing')).json()).length,0);
    assert.equal((await (await call('/software?q=%27%20OR%201%3D1--')).json()).length,0);
    response=await call(`/software/${created.id}`,'PUT',{...record,version:'20.0.0',notes:'Updated'});
    assert.equal(response.status,200);assert.equal((await response.json()).version,'20.0.0');
    // Reopen the real database connection to check persistence independently of React state.
    await new Promise(resolve=>server.close(resolve));server=null;
    await store.close();store=await openStore(provider,options);
    assert.equal((await store.get(created.id)).version,'20.0.0');
    server=createApp(store).listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
    const url=`http://127.0.0.1:${server.address().port}/api/software/${created.id}`;
    assert.equal((await fetch(url,{method:'DELETE'})).status,204);
    assert.equal((await fetch(url)).status,404);
    assert.equal((await fetch(url,{method:'DELETE'})).status,404);
    assert.equal((await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)})).status,404);
    assert.equal((await store.list()).length,0);
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    await store?.close();await mongo?.stop();await rm(directory,{recursive:true,force:true});
  }
});
