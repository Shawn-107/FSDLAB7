import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const empty = {product:'',vendor:'',version:'',category:'Framework',environment:'Production',priority:'Medium',notes:''};
async function request(path,options) {
  const response = await fetch(`/api${path}`,options);
  if (response.status === 204) return null;
  const body = await response.json().catch(()=>({message:'Backend unavailable. Start the Express server.'}));
  if (!response.ok) throw Object.assign(new Error(body.message || 'Request failed.'),{fields:body.errors});
  return body;
}
function Badge({value}) {return <span className={`badge ${value.toLowerCase()}`}>{value}</span>;}
function Field({label,error,children}) {return <label className="field"><span>{label}</span>{children}{error && <small className="error">{error}</small>}</label>;}
function RecordForm({record,onSave,onCancel,busy,errors}) {
  const [form,setForm]=useState(record || empty);
  const first=useRef(null);
  useEffect(()=>first.current?.focus(),[]);
  function change(e) {setForm({...form,[e.target.name]:e.target.value});}
  return <form onSubmit={e=>{e.preventDefault();onSave(form);}}>
    <div className="panel-heading"><div><p className="eyebrow">STACK ENTRY</p><h2>{record ? 'Edit software' : 'Track software'}</h2></div><span className="entry-icon">＋</span></div>
    <div className="form-grid">
      <Field label="Product name" error={errors.product}><input ref={first} required maxLength={80} name="product" value={form.product} onChange={change} placeholder="e.g. React"/></Field>
      <Field label="Vendor / maintainer" error={errors.vendor}><input required maxLength={80} name="vendor" value={form.vendor} onChange={change} placeholder="e.g. Meta"/></Field>
      <Field label="Installed version" error={errors.version}><input required maxLength={40} name="version" value={form.version} onChange={change} placeholder="e.g. 19.2.0"/></Field>
      <Field label="Category" error={errors.category}><select name="category" value={form.category} onChange={change}>{['Framework','Runtime','Database','Operating system','Infrastructure'].map(x=><option key={x}>{x}</option>)}</select></Field>
    </div>
    <fieldset><legend>Environment</legend><div className="radios">{['Production','Staging','Development'].map(x=><label key={x}><input type="radio" name="environment" value={x} checked={form.environment===x} onChange={change}/>{x}</label>)}</div>{errors.environment && <small className="error">{errors.environment}</small>}</fieldset>
    <Field label="Review priority" error={errors.priority}><select name="priority" value={form.priority} onChange={change}>{['Critical','High','Medium','Low'].map(x=><option key={x}>{x}</option>)}</select></Field>
    <Field label="Notes" error={errors.notes}><textarea maxLength={500} name="notes" value={form.notes} onChange={change} rows={3} placeholder="Owner, deployment context, next review…"/></Field>
    <p className="hint">Priority is assigned by you. No live vulnerability scan is performed.</p>
    <div className="form-actions"><button className="primary" disabled={busy}>{busy ? 'Saving…' : record ? 'Save changes' : 'Add software'} <span>↗</span></button>{record && <button type="button" disabled={busy} onClick={onCancel}>Cancel edit</button>}</div>
  </form>;
}
function Inventory({records,loading,onEdit,onDelete,busy}) {
  if (loading) return <div className="empty" role="status">Loading your stack…</div>;
  if (!records.length) return <div className="empty"><div className="empty-icon">◎</div><h3>No matching software</h3><p>Add your first product or change your search.</p></div>;
  return <div className="records">{records.map(r=><article className="record" key={r.id}>
    <div className="record-top"><div><span className="category">{r.category}</span><h3>{r.product} <span className="version">v{r.version}</span></h3></div><Badge value={r.priority}/></div>
    <p className="metadata">{r.vendor} <span>·</span> {r.environment}</p>
    {r.notes && <p className="notes">{r.notes}</p>}
    <div className="record-bottom"><span>Updated {new Date(r.updatedAt).toLocaleDateString()}</span><div><button disabled={busy} onClick={()=>onEdit(r)} aria-label={`Edit ${r.product}`}>Edit ↗</button><button className="delete" disabled={busy} onClick={()=>onDelete(r)} aria-label={`Delete ${r.product}`}>Delete</button></div></div>
  </article>)}</div>;
}
function App() {
  const [records,setRecords]=useState([]),[query,setQuery]=useState(''),[editing,setEditing]=useState(null);
  const [health,setHealth]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [message,setMessage]=useState(''),[error,setError]=useState(''),[errors,setErrors]=useState({});
  const [deleting,setDeleting]=useState(null),[formKey,setFormKey]=useState(0);
  const dialog=useRef(null),deleteTrigger=useRef(null);
  async function load() {
    setLoading(true);setError('');
    try {const [rows,status]=await Promise.all([request('/software'),request('/health')]);setRecords(rows);setHealth(status);}
    catch(e){setError(e.message);}finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  useEffect(()=>{if(deleting) dialog.current?.showModal();},[deleting]);
  function reset(){setEditing(null);setErrors({});setFormKey(x=>x+1);}
  async function save(data) {
    setBusy(true);setError('');setMessage('');setErrors({});
    try {
      const saved=await request(editing ? `/software/${editing.id}` : '/software',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      setRecords(rows=>editing ? rows.map(r=>r.id===saved.id?saved:r) : [saved,...rows]);
      setMessage(`${saved.product} ${editing?'updated':'added'} successfully.`);reset();
    }catch(e){setError(e.message);setErrors(e.fields || {});}finally{setBusy(false);}
  }
  function closeDialog(){dialog.current?.close();setDeleting(null);deleteTrigger.current?.focus();}
  async function remove() {
    setBusy(true);setError('');setMessage('');
    try {await request(`/software/${deleting.id}`,{method:'DELETE'});setRecords(rows=>rows.filter(r=>r.id!==deleting.id));setMessage(`${deleting.product} deleted successfully.`);if(editing?.id===deleting.id)reset();closeDialog();}
    catch(e){setError(e.message);closeDialog();}finally{setBusy(false);}
  }
  const visible=records.filter(r=>['product','vendor','version','category','environment','priority','notes'].some(k=>r[k].toLowerCase().includes(query.trim().toLowerCase())));
  return <><header><a className="brand" href="#"><span className="shield">V</span>VulnWatch<span className="brand-divider">/</span><span className="brand-sub">STACK INVENTORY</span></a><span className="connection"><i className={health?'online':''}/>{health ? `${health.database==='mongo'?'MongoDB':'SQLite'} connected` : 'Connecting…'}</span></header>
    <main><section className="hero"><p className="eyebrow">YOUR SOFTWARE. ONE CLEAR VIEW.</p><div className="hero-line"><h1>Watch the stack.<br/><span>Own the context.</span></h1><div className="orbit" aria-hidden="true"><div>V</div></div></div><p className="intro">Keep the technologies you rely on in focus. Track versions, organize environments, and decide what deserves your next review.</p></section>
      <section className="stats" aria-label="Inventory summary">{[['Tracked products',records.length],['Production',records.filter(r=>r.environment==='Production').length],['High priority',records.filter(r=>['Critical','High'].includes(r.priority)).length]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value.toString().padStart(2,'0')}</strong></div>)}</section>
      <div className="feedback" aria-live="polite">{message && <p className="success" role="status">✓ {message}</p>}{error && <p className="error-banner" role="alert">{error} <button onClick={load} disabled={busy}>Retry connection</button></p>}</div>
      <section className="workspace"><aside className="panel"><RecordForm key={formKey} record={editing} onSave={save} onCancel={reset} busy={busy||loading||!health} errors={errors}/></aside>
        <section className="inventory"><div className="inventory-heading"><div><p className="eyebrow">TRACKED TECHNOLOGIES</p><h2>Your stack <span>{records.length}</span></h2></div><button disabled={loading||busy} onClick={load}>Refresh ↻</button></div><label className="search"><span>⌕</span><input aria-label="Search software" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search product, vendor, environment…"/>{query && <button onClick={()=>setQuery('')} aria-label="Clear search">×</button>}</label><p className="result-count">Showing {visible.length} of {records.length} products</p><Inventory records={visible} loading={loading} busy={busy} onEdit={r=>{setEditing(r);setErrors({});setFormKey(x=>x+1);}} onDelete={r=>{deleteTrigger.current=document.activeElement;setDeleting(r);}}/></section>
      </section></main><footer><span>VulnWatch · Watch the stack. Not the noise.</span><span>Lab 07 / React SPA + Express + {health?.database==='mongo'?'MongoDB':'SQLite'}</span></footer>
      <dialog ref={dialog} onCancel={e=>{e.preventDefault();if(!busy)closeDialog();}} aria-labelledby="delete-title"><h2 id="delete-title">Delete {deleting?.product}?</h2><p>This removes the record from the active database.</p><div className="form-actions"><button autoFocus disabled={busy} onClick={closeDialog}>Keep record</button><button className="danger" disabled={busy} onClick={remove}>{busy?'Deleting…':'Delete record'}</button></div></dialog>
    </>;
}
createRoot(document.getElementById('root')).render(<App/>);
