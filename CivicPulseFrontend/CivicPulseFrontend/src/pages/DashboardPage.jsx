import { useCallback, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowRight, ArrowUpRight, CheckCircle2, Clock3, FilePlus2, Flag, Gauge, MapPin, RefreshCw, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi, issueApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Button, EmptyState, ErrorState, LoadingState, StatCard, StatusBadge } from '../components/UI.jsx';
import { IssueMiniCard } from '../components/IssueVisuals.jsx';
import { categoryLabel, compactNumber, formatDate, statusLabel } from '../utils/format.js';

const COLORS = ['#2e7d63', '#e4a04d', '#6b88de', '#bd7dba', '#48a4ae', '#b2b7c4', '#d86f55', '#8eb76e'];

function ResidentDashboard({ user }) {
  const [page, setPage] = useState(null);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const mine = await issueApi.mine({ page: 0, size: 100, sort: 'createdAt,desc' });
      setPage({ ...mine, content: (mine.content || []).slice(0, 5) });
      setRecent(mine.content || []);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const items = recent || [];
    return {
      total: page?.totalElements ?? items.length,
      open: items.filter((i) => !['RESOLVED', 'REJECTED'].includes(i.status)).length,
      resolved: items.filter((i) => i.status === 'RESOLVED').length,
      inProgress: items.filter((i) => ['ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length,
    };
  }, [recent, page?.totalElements]);

  if (loading) return <LoadingState label="Preparing your community overview…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return <div className="dashboard-stack">
    <section className="welcome-banner resident-banner"><div className="welcome-orb orb-one" /><div className="welcome-orb orb-two" /><div className="welcome-copy"><div className="welcome-eyebrow"><span className="welcome-spark">✳</span> YOUR IMPACT STARTS HERE</div><h2>Good to see you, {user?.name?.split(' ')[0] || 'neighbor'}<span className="welcome-comma">.</span></h2><p>Your voice makes a difference. See what’s moving, and what needs a little more attention.</p><div className="welcome-actions"><Link to="/issues/new" className="btn btn-light-solid"><FilePlus2 size={16} /> Report an issue <ArrowRight size={15} /></Link><Link to="/issues" className="welcome-secondary-link">Explore community reports <ArrowRight size={15} /></Link></div></div><div className="welcome-illustration"><div className="welcome-circle circle-big"><MapPin size={22} /></div><div className="welcome-circle circle-small"><CheckCircle2 size={18} /></div><div className="welcome-ring ring-one" /><div className="welcome-ring ring-two" /><span className="welcome-caption"><span /> Your neighborhood, connected</span></div></section>
    <div className="section-heading"><div><h3>Your report snapshot</h3><p>A quick look at the issues you’ve raised.</p></div><Link to="/my-reports" className="text-link">View all reports <ArrowRight size={15} /></Link></div>
    <div className="stats-grid stats-grid-four"><StatCard label="Reports raised" value={counts.total} helper="Your total submissions" icon={Flag} tone="green" /><StatCard label="Needs attention" value={counts.open} helper="Still being worked on" icon={Clock3} tone="amber" /><StatCard label="In progress" value={counts.inProgress} helper="Work has been assigned" icon={Activity} tone="blue" /><StatCard label="Resolved" value={counts.resolved} helper="Issues marked complete" icon={CheckCircle2} tone="purple" /></div>
    <div className="dashboard-columns"><section className="surface-card issue-feed-card"><div className="surface-card-head"><div><h3>Recently submitted</h3><p>Follow your latest updates.</p></div><Link to="/my-reports" className="icon-link" aria-label="See all reports"><ArrowRight size={17} /></Link></div>{page?.content?.length ? <div className="issue-mini-list">{page.content.map((issue) => <IssueMiniCard issue={issue} key={issue.id} />)}</div> : <EmptyState icon={Flag} title="Your first report starts here" description="Spot something that needs attention? Send a report and follow its progress here." action={<Link to="/issues/new" className="btn btn-primary"><FilePlus2 size={16} /> Report an issue</Link>} />}</section><section className="surface-card neighbor-card"><div className="neighbor-card-art"><div className="neighbor-sun" /><div className="neighbor-hill hill-back" /><div className="neighbor-hill hill-front" /><div className="neighbor-house house-one" /><div className="neighbor-house house-two" /><div className="neighbor-house house-three" /><div className="neighbor-road" /><MapPin className="neighbor-pin" size={25} /></div><div className="neighbor-card-copy"><span className="eyebrow">A BETTER BLOCK, TOGETHER</span><h3>Every report has a ripple effect.</h3><p>Share what you see. Support a neighbor’s report. Make it easier for local teams to spot patterns and act.</p><Link to="/issues" className="btn btn-secondary btn-block">Browse neighborhood reports <ArrowRight size={15} /></Link></div></section></div>
    <div className="dashboard-bottom-note"><div className="note-mark"><ShieldAlert size={18} /></div><div><strong>Safety first</strong><span>For emergencies or immediate danger, contact your local emergency services instead of relying on this platform.</span></div></div>
  </div>;
}

function StaffDashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [data, latest, workload] = await Promise.all([
        dashboardApi.summary(),
        issueApi.list({ page: 0, size: 5, sort: 'createdAt,desc' }),
        user?.role === 'ADMIN' ? issueApi.list({ page: 0, size: 5, status: 'ASSIGNED', sort: 'updatedAt,asc' }) : issueApi.assigned({ page: 0, size: 5, sort: 'dueAt,asc' }),
      ]);
      setSummary(data); setRecent(latest.content || []); setAssigned(workload.content || []);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [user?.role]);
  useEffect(() => { load(); }, [load]);

  const statusData = useMemo(() => Object.entries(summary?.byStatus || {}).map(([name, value]) => ({ name: statusLabel(name), value: Number(value), raw: name })), [summary]);
  const categoryData = useMemo(() => Object.entries(summary?.byCategory || {}).map(([name, value]) => ({ name: categoryLabel(name), value: Number(value) })).sort((a, b) => b.value - a.value), [summary]);
  const resolvedRate = summary?.totalIssues ? Math.round((summary.resolvedIssues / summary.totalIssues) * 100) : 0;

  if (loading) return <LoadingState label="Gathering live operations data…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return <div className="dashboard-stack">
    <section className="welcome-banner ops-banner"><div className="welcome-orb orb-one" /><div className="welcome-orb orb-two" /><div className="welcome-copy"><div className="welcome-eyebrow"><span className="welcome-spark">✳</span> COMMUNITY OPERATIONS</div><h2>Let’s make today count<span className="welcome-comma">.</span></h2><p>Hi {user?.name?.split(' ')[0] || 'there'}, here’s the pulse of your service area right now.</p><div className="welcome-actions"><Link to="/issues" className="btn btn-light-solid"><ClipboardListIcon /> Review reports <ArrowRight size={15} /></Link>{user?.role === 'ADMIN' && <Link to="/users" className="welcome-secondary-link">Manage access <ArrowRight size={15} /></Link>}</div></div><div className="ops-score"><div className="ops-score-inner"><Gauge size={23} /><strong>{resolvedRate}<small>%</small></strong><span>Resolved overall</span><div className="ops-score-track"><span style={{ width: `${resolvedRate}%` }} /></div></div><span className="ops-score-caption">Service completion</span></div></section>
    <div className="section-heading"><div><h3>Service overview</h3><p>Operational metrics from current issue records.</p></div><Button variant="ghost" icon={RefreshCw} onClick={load}>Refresh data</Button></div>
    <div className="stats-grid stats-grid-four"><StatCard label="Total reports" value={compactNumber(summary?.totalIssues)} helper="All recorded reports" icon={Flag} tone="green" /><StatCard label="Open reports" value={compactNumber(summary?.openIssues)} helper="Awaiting resolution" icon={Activity} tone="blue" /><StatCard label="Resolved reports" value={compactNumber(summary?.resolvedIssues)} helper="Completed issues" icon={CheckCircle2} tone="purple" /><StatCard label="Overdue" value={compactNumber(summary?.overdueIssues)} helper="Past service target" icon={ShieldAlert} tone="amber" /></div>
    <div className="chart-grid"><section className="surface-card chart-card"><div className="surface-card-head"><div><h3>Issue status</h3><p>Distribution across the workflow.</p></div><span className="head-icon"><Activity size={17} /></span></div>{statusData.length ? <div className="chart-body status-chart-body"><ResponsiveContainer width="100%" height={228}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={4} cornerRadius={5} stroke="none">{statusData.map((item, index) => <Cell key={item.raw} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ece8', boxShadow: '0 8px 24px rgba(24,40,32,.08)' }} /></PieChart></ResponsiveContainer><div className="chart-legend">{statusData.map((item, index) => <div key={item.raw}><span style={{ background: COLORS[index % COLORS.length] }} /><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <EmptyState title="No status data yet" description="As reports are submitted, status distribution will appear here." />}</section>
      <section className="surface-card chart-card"><div className="surface-card-head"><div><h3>Reported by category</h3><p>Where community attention is needed.</p></div><span className="head-icon"><TrendingUp size={17} /></span></div>{categoryData.length ? <div className="chart-body"><ResponsiveContainer width="100%" height={278}><AreaChart data={categoryData} margin={{ top: 10, right: 4, left: -22, bottom: 8 }}><defs><linearGradient id="categoryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3c8b6d" stopOpacity={0.22} /><stop offset="100%" stopColor="#3c8b6d" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf1ee" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7c8982' }} axisLine={false} tickLine={false} interval={0} angle={-14} textAnchor="end" height={48} /><YAxis tick={{ fontSize: 11, fill: '#7c8982' }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7ece8', boxShadow: '0 8px 24px rgba(24,40,32,.08)' }} /><Area type="monotone" dataKey="value" stroke="#2d7f60" strokeWidth={2.5} fill="url(#categoryFill)" activeDot={{ r: 5, strokeWidth: 0 }} /></AreaChart></ResponsiveContainer></div> : <EmptyState title="No category data yet" description="Report categories will be summarized here." />}</section></div>
    <div className="dashboard-columns"><section className="surface-card issue-feed-card"><div className="surface-card-head"><div><h3>Latest reports</h3><p>Most recently submitted issues.</p></div><Link to="/issues" className="text-link">View explorer <ArrowRight size={15} /></Link></div>{recent.length ? <div className="issue-mini-list">{recent.map((issue) => <IssueMiniCard issue={issue} key={issue.id} showReporter />)}</div> : <EmptyState icon={Flag} title="No reports yet" description="New community reports will appear here." />}</section><section className="surface-card workload-card"><div className="surface-card-head"><div><h3>{user?.role === 'ADMIN' ? 'Needs assignment' : 'Your assigned work'}</h3><p>{user?.role === 'ADMIN' ? 'Reports waiting for a team member.' : 'A focused queue for your next actions.'}</p></div><span className="head-icon"><Clock3 size={17} /></span></div>{assigned.length ? <div className="workload-list">{assigned.map((issue) => <Link className="workload-item" to={`/issues/${issue.id}`} key={issue.id}><div className={`workload-status workload-${String(issue.status).toLowerCase()}`}><Clock3 size={16} /></div><div className="workload-item-copy"><strong>{issue.title}</strong><span>CP-{String(issue.id).padStart(4, '0')} · {issue.address || 'Location unavailable'}</span></div><ArrowUpRight size={16} /></Link>)}</div> : <EmptyState icon={CheckCircle2} title="Queue is clear" description="No issues in this queue right now." />}{user?.role !== 'RESIDENT' && <Link to={user?.role === 'ADMIN' ? '/issues?status=ASSIGNED' : '/assigned'} className="btn btn-secondary btn-block">Open workspace <ArrowRight size={15} /></Link>}</section></div>
    <div className="dashboard-bottom-note"><div className="note-mark"><ShieldAlert size={18} /></div><div><strong>Keep the record trustworthy</strong><span>Use status updates and internal notes to preserve a clear history of decisions and field work.</span></div></div>
  </div>;
}

function ClipboardListIcon() { return <Activity size={16} />; }

export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === 'RESIDENT' ? <ResidentDashboard user={user} /> : <StaffDashboard user={user} />;
}
