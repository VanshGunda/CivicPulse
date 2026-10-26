import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, ChevronRight, Clock3, MailOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import { Button, EmptyState, ErrorState, LoadingState, PageTitle, Pagination } from '../components/UI.jsx';
import { formatRelative } from '../utils/format.js';

export default function NotificationsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const { notify } = useToast();
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await notificationApi.list({ page, size: 20, sort: 'createdAt,desc' })); } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); } }, [page]);
  useEffect(() => { load(); }, [load]);

  async function markRead(item) {
    if (item.read) return;
    setBusy(item.id);
    try { const updated = await notificationApi.markRead(item.id); setData((prev) => ({ ...prev, content: prev.content.map((n) => n.id === item.id ? updated : n) })); }
    catch (err) { notify(getErrorMessage(err, 'Notification could not be marked as read.'), 'error'); }
    finally { setBusy(null); }
  }

  const unread = data?.content?.filter((item) => !item.read).length || 0;
  return <div className="page-stack"><PageTitle eyebrow="STAY IN THE LOOP" title="Notifications" description="Your updates from issue reports, assignments and community activity." action={<Button variant="secondary" icon={CheckCheck} onClick={async () => { const unreadItems = data?.content?.filter((n) => !n.read) || []; for (const item of unreadItems) await markRead(item); }}>Mark visible as read</Button>} />
    <div className="notification-summary"><div className="notification-summary-icon"><Bell size={19} /></div><div><strong>{unread} unread on this page</strong><span>Notifications help you follow changes without needing to refresh every report.</span></div><Sparkles size={19} className="notification-summary-spark" /></div>
    <section className="surface-card notification-list-card">{loading ? <LoadingState label="Checking for updates…" /> : error ? <ErrorState message={error} onRetry={load} /> : !data?.content?.length ? <EmptyState icon={MailOpen} title="You’re all caught up" description="When a report changes or someone assigns work, you’ll see an update here." /> : <div className="notification-list">{data.content.map((item) => <article className={`notification-item ${item.read ? 'is-read' : 'is-unread'}`} key={item.id}><div className={`notification-item-icon ${item.read ? '' : 'unread'}`}><Bell size={17} /></div><div className="notification-item-copy"><div className="notification-item-title"><strong>{item.title}</strong>{!item.read && <span className="unread-chip">New</span>}</div><p>{item.message}</p><div className="notification-item-meta"><span><Clock3 size={13} />{formatRelative(item.createdAt)}</span>{item.issueId && <Link to={`/issues/${item.issueId}`}>Open report CP-{String(item.issueId).padStart(4, '0')} <ChevronRight size={13} /></Link>}</div></div>{!item.read && <Button size="sm" variant="ghost" loading={busy === item.id} onClick={() => markRead(item)}>Mark read</Button>}</article>)}</div>}{!loading && data && <Pagination page={data.number || 0} totalPages={data.totalPages || 0} onChange={setPage} />}</section>
  </div>;
}
