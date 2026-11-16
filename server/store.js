import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

export const categories = ['Framework','Runtime','Database','Operating system','Infrastructure'];
export const environments = ['Production','Staging','Development'];
export const priorities = ['Critical','High','Medium','Low'];
export function validate(input) {
  const errors = {};
  const data = {};
  for (const [key, max] of Object.entries({product:80,vendor:80,version:40,notes:500})) {
    const value = input?.[key];
    if (typeof value !== 'string' || value.trim().length > max || (key !== 'notes' && !value.trim())) errors[key] = `${key} must be ${key === 'notes' ? '0' : '1'}–${max} characters.`;
    else data[key] = value.trim();
  }
  for (const [key, allowed] of Object.entries({category:categories,environment:environments,priority:priorities})) {
    if (!allowed.includes(input?.[key])) errors[key] = `Choose a valid ${key}.`;
    else data[key] = input[key];
  }
  return {data,errors};
}

export async function openStore(provider, options = {}) {
  if (provider === 'sqlite') {
    const file = options.sqlitePath || './data/vulnwatch.db';
    if (file !== ':memory:') mkdirSync(dirname(resolve(file)), {recursive:true});
    const db = new DatabaseSync(file);
    db.exec(`CREATE TABLE IF NOT EXISTS software (
      id TEXT PRIMARY KEY, product TEXT NOT NULL, vendor TEXT NOT NULL, version TEXT NOT NULL,
      category TEXT NOT NULL, environment TEXT NOT NULL, priority TEXT NOT NULL,
      notes TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)`);
    return {
      provider,
      list: async () => db.prepare('SELECT * FROM software ORDER BY createdAt DESC, id').all(),
      get: async id => db.prepare('SELECT * FROM software WHERE id = ?').get(id),
      create: async data => {
        const now = new Date().toISOString();
        const record = {id:randomUUID(),...data,createdAt:now,updatedAt:now};
        db.prepare('INSERT INTO software (id,product,vendor,version,category,environment,priority,notes,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .run(...['id','product','vendor','version','category','environment','priority','notes','createdAt','updatedAt'].map(k=>record[k]));
        return record;
      },
      update: async (id,data) => {
        const now = new Date().toISOString();
        const result = db.prepare('UPDATE software SET product=?,vendor=?,version=?,category=?,environment=?,priority=?,notes=?,updatedAt=? WHERE id=?')
          .run(...['product','vendor','version','category','environment','priority','notes'].map(k=>data[k]),now,id);
        return result.changes ? db.prepare('SELECT * FROM software WHERE id=?').get(id) : null;
      },
      remove: async id => !!db.prepare('DELETE FROM software WHERE id=?').run(id).changes,
      close: async () => db.close()
    };
  }
  if (provider !== 'mongo') throw new Error('DB_PROVIDER must be sqlite or mongo.');
  const connection = await mongoose.createConnection(options.mongoUri || 'mongodb://127.0.0.1:27017/vulnwatch', {serverSelectionTimeoutMS:5000}).asPromise();
  const schema = new mongoose.Schema({
    _id:{type:String,default:randomUUID},product:{type:String,required:true},vendor:{type:String,required:true},
    version:{type:String,required:true},category:{type:String,enum:categories},environment:{type:String,enum:environments},
    priority:{type:String,enum:priorities},notes:String
  },{timestamps:true,versionKey:false});
  const Software = connection.model('Software',schema);
  const plain = doc => {
    if (!doc) return null;
    const {_id,...rest} = doc;
    return {id:_id,...rest,createdAt:new Date(rest.createdAt).toISOString(),updatedAt:new Date(rest.updatedAt).toISOString()};
  };
  return {
    provider,
    list:async () => (await Software.find().sort({createdAt:-1,_id:1}).lean()).map(plain),
    get:async id => plain(await Software.findById(id).lean()),
    create:async data => plain((await Software.create(data)).toObject()),
    update:async (id,data) => plain(await Software.findByIdAndUpdate(id,{$set:data},{new:true,runValidators:true}).lean()),
    remove:async id => !!(await Software.deleteOne({_id:id})).deletedCount,
    close:async () => connection.close()
  };
}
