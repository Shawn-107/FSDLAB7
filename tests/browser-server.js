// Isolated preview for repeatable browser QA; never uses the user's databases.
import {MongoMemoryServer} from 'mongodb-memory-server';
import {join} from 'node:path';
import {openStore} from '../server/store.js';
import {createApp} from '../server/app.js';
const mongo=await MongoMemoryServer.create({binary:{version:'8.0.17',downloadDir:join(process.cwd(),'data','mongodb-binaries')}});
const stores=[await openStore('sqlite',{sqlitePath:':memory:'}),await openStore('mongo',{mongoUri:mongo.getUri('browser_qa')})];
const servers=stores.map((store,i)=>createApp(store).listen(3017+i,'127.0.0.1',()=>console.log(`${store.provider} browser QA: http://127.0.0.1:${3017+i}`)));
for(const signal of ['SIGTERM','SIGINT']) process.once(signal,async()=>{await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));await Promise.all(stores.map(store=>store.close()));await mongo.stop();process.exit(0);});
