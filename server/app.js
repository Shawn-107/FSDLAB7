import express from 'express';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { validate } from './store.js';

export function createApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({limit:'16kb'}));
  app.get('/api/health', (_req,res)=>res.json({status:'ok',database:store.provider}));
  app.get('/api/software', async (req,res)=> {
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const records = await store.list();
    res.json(records.filter(r=>['product','vendor','version','category','environment','priority','notes'].some(k=>String(r[k]).toLowerCase().includes(query))));
  });
  app.get('/api/software/:id',async(req,res)=> {
    const record=await store.get(req.params.id);
    record ? res.json(record) : res.status(404).json({message:'Record not found.'});
  });
  const save = update => async(req,res)=> {
    const {data,errors}=validate(req.body);
    if (Object.keys(errors).length) return res.status(400).json({message:'Check the highlighted fields.',errors});
    const record = update ? await store.update(req.params.id,data) : await store.create(data);
    if (!record) return res.status(404).json({message:'Record not found.'});
    res.status(update ? 200 : 201).json(record);
  };
  app.post('/api/software',save(false));
  app.put('/api/software/:id',save(true));
  app.delete('/api/software/:id',async(req,res)=> {
    if (!await store.remove(req.params.id)) return res.status(404).json({message:'Record not found.'});
    res.status(204).end();
  });
  app.use('/api',(_req,res)=>res.status(404).json({message:'API route not found.'}));
  if (existsSync(resolve('dist/index.html'))) {
    app.use(express.static(resolve('dist')));
    app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')));
  }
  app.use((err,_req,res,_next)=> {
    if (err.type === 'entity.parse.failed') return res.status(400).json({message:'Invalid JSON.'});
    if (err.status === 413) return res.status(413).json({message:'Request is too large.'});
    console.error('Request failed:',err.message);
    res.status(500).json({message:'Database operation failed. Please retry.'});
  });
  return app;
}
