import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, UserCheck, UserCog, Users, UserX } from 'lucide-react';
import { adminApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Button, EmptyState, ErrorState, LoadingState, PageTitle, Pagination } from '../components/UI.jsx';
import { formatDate, initials } from '../utils/format.js';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [usersPage, setUsersPage] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const { notify } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setUsersPage(await adminApi.users({ q: query.trim() || undefined, page, size: 20, sort: 'createdAt,desc' })); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [page, query]);
  useEffect(() => { const timer = setTimeout(load, 240); return () => clearTimeout(timer); }, [load]);

  async function updateRole(person, role) {
    if (person.id === currentUser?.id) { notify('You cannot change your own role.', 'error'); return; }
    setBusyId(person.id);
    try { await adminApi.updateRole(person.id, role); notify(`${person.name} is now ${role.toLowerCase()}.`); await load(); }
    catch (err) { notify(getErrorMessage(err, 'Role could not be updated.'), 'error'); }
    finally { setBusyId(null); }
  }
  async function updateEnabled(person) {
    if (person.id === currentUser?.id) { notify('You cannot disable your own account.', 'error'); return; }
    const action = person.enabled ? 'disable' : 'enable';
    if (!window.confirm(`${action === 'disable' ? 'Disable' : 'Enable'} ${person.name}'s account?`)) return;
    setBusyId(person.id);
    try { await adminApi.updateEnabled(person.id, !person.enabled); notify(`Account ${person.enabled ? 'disabled' : 'enabled'}.`); await load(); }
    catch (err) { notify(getErrorMessage(err, 'Account status could not be changed.'), 'error'); }
    finally { setBusyId(null); }
  }

  const count = usersPage?.totalElements || 0;
  return <div className="page-stack"><PageTitle eyebrow="ACCESS CONTROL" title="People & access" description="Keep account access intentional and give each team the right level of control." />
    <div className="stats-grid stats-grid-three"><div className="mini-metric-card"><span className="mini-metric-icon metric-green"><Users size={18} /></span><div><span>Accounts found</span><strong>{count}</strong></div></div><div className="mini-metric-card"><span className="mini-metric-icon metric-blue"><UserCheck size={18} /></span><div><span>Enabled on this page</span><strong>{usersPage?.content?.filter((u) => u.enabled).length || 0}</strong></div></div><div className="mini-metric-card"><span className="mini-metric-icon metric-purple"><ShieldCheck size={18} /></span><div><span>Admin accounts on page</span><strong>{usersPage?.content?.filter((u) => u.role === 'ADMIN').length || 0}</strong></div></div></div>
    <section className="surface-card table-card"><div className="table-toolbar"><div><h3>Account directory</h3><p>Role changes take effect on the next authenticated request.</p></div><div className="table-search"><Search size={16} /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search name or email…" /></div></div>{loading ? <LoadingState label="Loading accounts…" /> : error ? <ErrorState message={error} onRetry={load} /> : !usersPage?.content?.length ? <EmptyState icon={Users} title="No accounts found" description="Try another search term." /> : <div className="responsive-table-wrap"><table className="data-table"><thead><tr><th>Person</th><th>Role</th><th>Account status</th><th>Joined</th><th>Account actions</th></tr></thead><tbody>{usersPage.content.map((person) => <tr key={person.id}><td><div className="table-primary-cell"><span className={`avatar table-avatar avatar-role-${person.role?.toLowerCase()}`}>{initials(person.name)}</span><div><strong>{person.name}{person.id === currentUser?.id && <span className="you-chip">You</span>}</strong><small>{person.email}</small></div></div></td><td><select className="role-select" value={person.role} disabled={busyId === person.id || person.id === currentUser?.id} onChange={(e) => updateRole(person, e.target.value)} aria-label={`Role for ${person.name}`}><option value="RESIDENT">Resident</option><option value="STAFF">Staff</option><option value="ADMIN">Admin</option></select></td><td><span className={`account-status ${person.enabled ? 'enabled' : 'disabled'}`}><span />{person.enabled ? 'Enabled' : 'Disabled'}</span></td><td>{formatDate(person.createdAt)}</td><td><Button size="sm" variant={person.enabled ? 'ghost-danger' : 'secondary'} loading={busyId === person.id} disabled={person.id === currentUser?.id} icon={person.enabled ? UserX : UserCog} onClick={() => updateEnabled(person)}>{person.enabled ? 'Disable' : 'Enable'}</Button></td></tr>)}</tbody></table></div>}{!loading && usersPage && <Pagination page={usersPage.number || 0} totalPages={usersPage.totalPages || 0} onChange={setPage} />}</section>
    <div className="dashboard-bottom-note"><div className="note-mark"><ShieldCheck size={18} /></div><div><strong>Security reminder</strong><span>Only promote accounts that should have access to staff workflows. Public registration always creates resident accounts.</span></div></div>
  </div>;
}
