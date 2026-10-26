import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { issueApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, EmptyState, ErrorState, LoadingState, PageTitle, Pagination, PriorityBadge, StatusBadge } from '../components/UI.jsx';
import { CategoryIcon } from '../components/IssueVisuals.jsx';
import { categoryLabel, formatRelative, isOverdue } from '../utils/format.js';

const categories = ['ROAD_DAMAGE', 'WASTE', 'STREETLIGHT', 'WATER_LEAK', 'DRAINAGE', 'PUBLIC_SAFETY', 'PARKS', 'OTHER'];
const statuses = ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function normalizePage(data) { return { content: data?.content || [], number: data?.number || 0, totalPages: data?.totalPages || 0, totalElements: data?.totalElements || 0 }; }

export default function IssuesPage({ mode = 'all' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isStaff } = useAuth();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({ status: searchParams.get('status') || '', category: searchParams.get('category') || '', priority: searchParams.get('priority') || '' });
  const [page, setPage] = useState(Number(searchParams.get('page') || 0));
  const [sort, setSort] = useState('createdAt,desc');
  const [view, setView] = useState('list');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async (overrides = {}) => {
    setLoading(true); setError('');
    try {
      if (mode === 'mine' || mode === 'assigned') {
        // These backend endpoints provide the current user's queue but do not accept server-side filters.
        // Load up to the API's supported 100-item page, then filter and paginate locally.
        const response = mode === 'mine'
          ? await issueApi.mine({ page: 0, size: 100, sort: 'createdAt,desc' })
          : await issueApi.assigned({ page: 0, size: 100, sort: 'createdAt,desc' });
        const needle = query.trim().toLowerCase();
        const filtered = (response.content || []).filter((item) =>
          (!filters.status || item.status === filters.status) &&
          (!filters.category || item.category === filters.category) &&
          (!filters.priority || item.priority === filters.priority) &&
          (!needle || `${item.title || ''} ${item.description || ''} ${item.address || ''}`.toLowerCase().includes(needle))
        );
        const pageSize = 10;
        setData({
          content: filtered.slice(page * pageSize, (page + 1) * pageSize),
          number: page,
          totalPages: Math.ceil(filtered.length / pageSize),
          totalElements: filtered.length,
        });
      } else {
        const args = { page, size: 10, sort, ...filters, q: query.trim(), ...overrides };
        Object.keys(args).forEach((key) => args[key] === '' && delete args[key]);
        setData(normalizePage(await issueApi.list(args)));
      }
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [filters, mode, page, query, sort]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const nextFilters = { status: searchParams.get('status') || '', category: searchParams.get('category') || '', priority: searchParams.get('priority') || '' };
    setQuery(q); setFilters(nextFilters); setPage(Number(searchParams.get('page') || 0));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 280);
    return () => window.clearTimeout(timer);
  }, [load]);

  const title = mode === 'mine' ? 'My reports' : mode === 'assigned' ? 'Assigned work' : 'Explore reports';
  const description = mode === 'mine' ? 'Every issue you have raised, with progress in one place.' : mode === 'assigned' ? 'Manage your assigned civic work and update the resolution timeline.' : 'A living picture of what your community needs, from first report to resolution.';
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasFilters = query.trim() || activeFilterCount > 0;

  function setFilter(key, value) { setFilters((prev) => ({ ...prev, [key]: value })); setPage(0); const next = new URLSearchParams(searchParams); if (value) next.set(key, value); else next.delete(key); next.delete('page'); setSearchParams(next, { replace: true }); }
  function changeSearch(value) { setQuery(value); setPage(0); const next = new URLSearchParams(searchParams); if (value.trim()) next.set('q', value.trim()); else next.delete('q'); next.delete('page'); setSearchParams(next, { replace: true }); }
  function clearFilters() { setQuery(''); setFilters({ status: '', category: '', priority: '' }); setPage(0); setSearchParams({}, { replace: true }); }

  const resultsSummary = useMemo(() => `${data?.totalElements || 0} ${data?.totalElements === 1 ? 'report' : 'reports'}`, [data]);

  return <div className="page-stack">
    <PageTitle eyebrow="COMMUNITY INTELLIGENCE" title={title} description={description} action={<Link to="/issues/new" className="btn btn-primary"><Plus size={17} /> New report</Link>} />
    <section className="surface-card explorer-card">
      <div className="explorer-toolbar"><div className="explorer-search"><Search size={18} /><input value={query} onChange={(e) => changeSearch(e.target.value)} placeholder="Search title, description or location…" aria-label="Search issues" />{query && <button onClick={() => changeSearch('')} aria-label="Clear search"><X size={15} /></button>}</div><Button variant={showFilters || activeFilterCount ? 'secondary-active' : 'secondary'} icon={SlidersHorizontal} onClick={() => setShowFilters(!showFilters)}>Filters{activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}</Button><div className="view-toggle"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view"><List size={17} /></button><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={17} /></button></div></div>
      {showFilters && <div className="filter-panel"><label><span>Status</span><select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label><label><span>Category</span><select value={filters.category} onChange={(e) => setFilter('category', e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}</select></label><label><span>Priority</span><select value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}><option value="">All priorities</option>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>{hasFilters && <button className="clear-filter-btn" onClick={clearFilters}><X size={14} /> Clear all</button>}</div>}
      <div className="results-toolbar"><div><strong>{resultsSummary}</strong><span> {hasFilters ? 'matching your filters' : 'in the community register'}</span></div><div className="results-sort"><span>Sort by</span><select aria-label="Sort issues" value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); const nextParams = new URLSearchParams(searchParams); nextParams.delete('page'); setSearchParams(nextParams, { replace: true }); }}> <option value="createdAt,desc">Newest first</option><option value="createdAt,asc">Oldest first</option><option value="updatedAt,desc">Recently updated</option><option value="priority,desc">Priority</option></select></div></div>
      {loading ? <LoadingState label="Finding reports…" /> : error ? <ErrorState message={error} onRetry={load} /> : !data?.content?.length ? <EmptyState icon={Filter} title={hasFilters ? 'No matching reports' : 'The register is quiet for now'} description={hasFilters ? 'Try changing a filter or using a broader search term.' : 'Reports submitted by the community will appear here.'} action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : <Link to="/issues/new" className="btn btn-primary"><Plus size={16} /> Submit a report</Link>} /> : view === 'list' ? <div className="report-list">{data.content.map((issue) => <ReportRow key={issue.id} issue={issue} showReporter={isStaff && mode === 'all'} />)}</div> : <div className="report-grid">{data.content.map((issue) => <ReportGridCard key={issue.id} issue={issue} />)}</div>}
      {!loading && !error && data?.content?.length > 0 && <Pagination page={data.number} totalPages={data.totalPages} onChange={(next) => { setPage(next); const q = new URLSearchParams(searchParams); if (next > 0) q.set('page', String(next)); else q.delete('page'); setSearchParams(q); }} />}
    </section>
  </div>;
}

function ReportRow({ issue, showReporter }) {
  return <Link to={`/issues/${issue.id}`} className="report-row"><CategoryIcon category={issue.category} /><div className="report-row-main"><div className="report-row-top"><span className="issue-id">CP-{String(issue.id).padStart(4, '0')}</span><StatusBadge status={issue.status} /><PriorityBadge priority={issue.priority} />{isOverdue(issue) && <span className="overdue-chip">Overdue</span>}</div><h3>{issue.title}</h3><p>{issue.description}</p><div className="report-row-meta"><span><MapPinIcon />{issue.address || 'Location not provided'}</span><span>Updated {formatRelative(issue.updatedAt || issue.createdAt)}</span>{showReporter && <span>By {issue.reporterName || 'Resident'}</span>}</div></div><div className="report-row-right"><span className="support-count">♡ <strong>{issue.supportCount || 0}</strong></span><span className="row-arrow">↗</span></div></Link>;
}

function ReportGridCard({ issue }) {
  return <Link to={`/issues/${issue.id}`} className="report-grid-card"><div className="grid-card-top"><CategoryIcon category={issue.category} /><PriorityBadge priority={issue.priority} /></div><span className="issue-id">CP-{String(issue.id).padStart(4, '0')}</span><h3>{issue.title}</h3><p>{issue.description}</p><div className="grid-card-location"><MapPinIcon />{issue.address || 'Location not provided'}</div><div className="grid-card-bottom"><StatusBadge status={issue.status} /><span>{formatRelative(issue.createdAt)}</span></div></Link>;
}
function MapPinIcon() { return <span aria-hidden="true" className="tiny-pin">⌖</span>; }
