import { useCallback, useEffect, useState } from 'react';
import { Building2, Check, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { departmentApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { Alert, Button, EmptyState, ErrorState, Field, LoadingState, PageTitle } from '../components/UI.jsx';
import { formatDate } from '../utils/format.js';

const blank = { name: '', description: '' };
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const { notify } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setDepartments(await departmentApi.listAll()); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(blank); setFormOpen(true); }
  function openEdit(item) { setEditing(item); setForm({ name: item.name, description: item.description || '' }); setFormOpen(true); }
  async function submit(event) {
    event.preventDefault(); setSaving(true);
    try {
      if (editing) await departmentApi.update(editing.id, form);
      else await departmentApi.create(form);
      notify(editing ? 'Department updated.' : 'Department created.');
      setFormOpen(false); await load();
    } catch (err) { notify(getErrorMessage(err, 'The department could not be saved.'), 'error'); }
    finally { setSaving(false); }
  }
  async function deactivate(item) {
    if (!window.confirm(`Deactivate ${item.name}? This will remove it from active department choices.`)) return;
    try { await departmentApi.deactivate(item.id); notify('Department deactivated.'); await load(); }
    catch (err) { notify(getErrorMessage(err, 'Department could not be deactivated.'), 'error'); }
  }

  const filtered = departments.filter((d) => `${d.name} ${d.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount = departments.filter((d) => d.active).length;

  return <div className="page-stack"><PageTitle eyebrow="SERVICE DIRECTORY" title="Departments" description="Keep service teams clear, active and easy to route reports to." action={<Button icon={Plus} onClick={openCreate}>Add department</Button>} />
    <div className="stats-grid stats-grid-three"><div className="mini-metric-card"><span className="mini-metric-icon metric-green"><Building2 size={18} /></span><div><span>Total departments</span><strong>{departments.length}</strong></div></div><div className="mini-metric-card"><span className="mini-metric-icon metric-blue"><Check size={18} /></span><div><span>Active</span><strong>{activeCount}</strong></div></div><div className="mini-metric-card"><span className="mini-metric-icon metric-amber"><X size={18} /></span><div><span>Inactive</span><strong>{departments.length - activeCount}</strong></div></div></div>
    {formOpen && <section className="surface-card inline-form-card"><div className="surface-card-head"><div><h3>{editing ? 'Edit department' : 'Create a department'}</h3><p>Departments help route reports to the right service team.</p></div><button className="icon-btn" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={17} /></button></div><form className="inline-department-form" onSubmit={submit}><Field label="Department name"><input className="control" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} maxLength={100} required placeholder="e.g. Roads & Infrastructure" /></Field><Field label="Description"><input className="control" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} maxLength={500} placeholder="What this department is responsible for" /></Field><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create department'}</Button></div></form></section>}
    <section className="surface-card table-card"><div className="table-toolbar"><div><h3>Department directory</h3><p>All departments, including inactive records.</p></div><div className="table-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search departments…" /></div></div>{loading ? <LoadingState label="Loading department directory…" /> : error ? <ErrorState message={error} onRetry={load} /> : !filtered.length ? <EmptyState icon={Building2} title="No departments found" description="Create a department or adjust your search." action={<Button onClick={openCreate} icon={Plus}>Add department</Button>} /> : <div className="responsive-table-wrap"><table className="data-table"><thead><tr><th>Department</th><th>Description</th><th>Created</th><th>Status</th><th className="table-actions-header">Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="table-primary-cell"><span className="table-dept-icon"><Building2 size={17} /></span><div><strong>{item.name}</strong><small>Department #{item.id}</small></div></div></td><td className="table-description">{item.description || 'No description added'}</td><td>{formatDate(item.createdAt)}</td><td><span className={`account-status ${item.active ? 'enabled' : 'disabled'}`}><span />{item.active ? 'Active' : 'Inactive'}</span></td><td><div className="row-action-group"><button className="icon-btn compact" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}><Edit3 size={15} /></button>{item.active && <button className="icon-btn compact danger-hover" onClick={() => deactivate(item)} aria-label={`Deactivate ${item.name}`}><Trash2 size={15} /></button>}</div></td></tr>)}</tbody></table></div>}</section>
  </div>;
}
