import { openStore } from './store.js';
import { createApp } from './app.js';
const provider = process.argv[2] || process.env.DB_PROVIDER || 'sqlite';
try {
  const store = await openStore(provider,{sqlitePath:process.env.SQLITE_PATH,mongoUri:process.env.MONGO_URI});
  const server = createApp(store).listen(Number(process.env.PORT || 3001),'127.0.0.1',()=>console.log(`VulnWatch: http://127.0.0.1:${server.address().port} (${provider})`));
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal,()=>server.close(async()=>{await store.close();process.exit(0);}));
} catch (error) {
  console.error(`Could not start ${provider} backend: ${error.message}`);
  process.exitCode=1;
}
