import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, FileImage, Flag, MapPin, MessageCircle, Paperclip, Send, ShieldCheck, ThumbsUp, Users, X } from 'lucide-react';
import { adminApi, departmentApi, issueApi, uploadApi } from '../api/civic.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Alert, Button, EmptyState, ErrorState, Field, LoadingState, PriorityBadge, StatusBadge } from '../components/UI.jsx';
import { ActivityMarker, CategoryLabel, CategoryIcon } from '../components/IssueVisuals.jsx';
import { formatDate, formatRelative, isOverdue, statusLabel, toLocalDateTime } from '../utils/format.js';

const nextStatuses = {
  SUBMITTED: ['VERIFIED', 'REJECTED'],
  VERIFIED: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['IN_PROGRESS'],
  REJECTED: ['SUBMITTED'],
};
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function IssueDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isStaff, isAdmin } = useAuth();
  const { notify } = useToast();
  const [issue, setIssue] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [status, setStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [priority, setPriority] = useState('');
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [supported, setSupported] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const [supportBusy, setSupportBusy] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'OTHER', address: '', latitude: '', longitude: '', photoUrl: '' });
  const [editBusy, setEditBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [detail, timeline, conversation] = await Promise.all([
        issueApi.get(id), issueApi.history(id), issueApi.comments(id),
      ]);
      setIssue(detail); setHistory(timeline || []); setComments(conversation || []);
      setStatus(detail.status); setPriority(detail.priority); setSupportCount(detail.supportCount || 0);
      setEditForm({ title: detail.title || '', description: detail.description || '', category: detail.category || 'OTHER', address: detail.address || '', latitude: detail.latitude ?? '', longitude: detail.longitude ?? '', photoUrl: detail.photoUrl || '' });
      if (isAdmin) {
        const [usersPage, departmentList] = await Promise.all([
          adminApi.users({ page: 0, size: 100 }), departmentApi.listAll(),
        ]);
        setStaffOptions((usersPage.content || []).filter((person) => person.role === 'STAFF' && person.enabled));
        setDepartments(departmentList || []);
        setAssigneeId(detail.assigneeId ? String(detail.assigneeId) : '');
        setDepartmentId(detail.departmentId ? String(detail.departmentId) : '');
      }
    } catch (err) { setError(getErrorMessage(err, 'This report could not be loaded.')); }
    finally { setLoading(false); }
  }, [id, isAdmin]);

  useEffect(() => { load(); }, [load]);
  const canEdit = issue && user?.role === 'RESIDENT' && issue.reporterId === user.id && issue.status === 'SUBMITTED';
  const mapUrl = issue?.latitude != null && issue?.longitude != null ? `https://www.openstreetmap.org/?mlat=${issue.latitude}&mlon=${issue.longitude}#map=16/${issue.latitude}/${issue.longitude}` : null;

  async function handleStatusUpdate(event) {
    event.preventDefault(); setUpdatingStatus(true);
    try {
      const updated = await issueApi.updateStatus(id, { status, comment: statusComment.trim() || null });
      setIssue(updated); setStatusComment('');
      await load(); notify('Issue status updated and saved to the timeline.');
    } catch (err) { notify(getErrorMessage(err, 'Status could not be updated.'), 'error'); }
    finally { setUpdatingStatus(false); }
  }

  async function handlePriorityUpdate(event) {
    event.preventDefault(); setUpdatingPriority(true);
    try {
      const updated = await issueApi.updatePriority(id, { priority }); setIssue(updated);
      notify('Priority and service target updated.'); await load();
    } catch (err) { notify(getErrorMessage(err, 'Priority could not be updated.'), 'error'); }
    finally { setUpdatingPriority(false); }
  }

  async function handleAssign(event) {
    event.preventDefault(); setAssignBusy(true);
    try {
      const updated = await issueApi.assign(id, { assigneeId: Number(assigneeId), departmentId: departmentId ? Number(departmentId) : null });
      setIssue(updated); await load(); notify('Report assigned successfully.');
    } catch (err) { notify(getErrorMessage(err, 'Assignment could not be saved.'), 'error'); }
    finally { setAssignBusy(false); }
  }

  async function handleComment(event) {
    event.preventDefault(); if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await issueApi.addComment(id, { message: comment.trim(), internal: isStaff && internal });
      setComments((prev) => [...prev, created]); setComment(''); setInternal(false);
      notify(isStaff && internal ? 'Internal note added.' : 'Comment posted.');
    } catch (err) { notify(getErrorMessage(err, 'Comment could not be posted.'), 'error'); }
    finally { setSubmittingComment(false); }
  }

  async function toggleSupport() {
    setSupportBusy(true);
    try {
      const result = supported ? await issueApi.removeSupport(id) : await issueApi.support(id);
      setSupported(result.supported); setSupportCount(result.supportCount);
      notify(result.supported ? 'You’ve supported this community report.' : 'Your support was removed.', 'info');
    } catch (err) { notify(getErrorMessage(err, 'Support could not be updated.'), 'error'); }
    finally { setSupportBusy(false); }
  }

  async function saveEdits(event) {
    event.preventDefault(); setEditBusy(true);
    try {
      const updated = await issueApi.update(id, {
        title: editForm.title.trim(), description: editForm.description.trim(), category: editForm.category,
        address: editForm.address.trim(), latitude: editForm.latitude === '' ? null : Number(editForm.latitude),
        longitude: editForm.longitude === '' ? null : Number(editForm.longitude), photoUrl: editForm.photoUrl || null,
      });
      setIssue(updated); setEditMode(false); notify('Your report was updated.'); await load();
    } catch (err) { notify(getErrorMessage(err, 'Your changes could not be saved.'), 'error'); }
    finally { setEditBusy(false); }
  }

  const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [history]);

  if (loading) return <LoadingState label="Opening report and activity history…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!issue) return <EmptyState title="Report not found" description="This report may have been removed or the link may be incorrect." action={<Button onClick={() => navigate('/issues')}>Back to reports</Button>} />;

  return <div className="page-stack detail-page">
    <div className="back-row"><Link to={location.state?.from || '/issues'} className="back-link"><ArrowLeft size={16} /> Back to reports</Link><span className="detail-id">CP-{String(issue.id).padStart(4, '0')}</span></div>
    {location.state?.possibleDuplicates?.length > 0 && <Alert type="info">Your report was submitted. We also found {location.state.possibleDuplicates.length} potential nearby report(s)—review them to avoid duplication.</Alert>}
    <section className="detail-hero surface-card"><div className="detail-hero-main"><div className="detail-badges"><StatusBadge status={issue.status} /><PriorityBadge priority={issue.priority} /><span className="detail-created">Submitted {formatRelative(issue.createdAt)}</span></div><h1>{issue.title}</h1><p className="detail-description">{issue.description}</p><div className="detail-metadata"><span><MapPin size={15} />{issue.address || 'Location not provided'}</span><span><CategoryIcon category={issue.category} /><CategoryLabel category={issue.category} /></span><span><Users size={15} />{issue.reporterName || 'Community member'}</span></div><div className="detail-actions"><Button variant={supported ? 'secondary-active' : 'secondary'} icon={ThumbsUp} loading={supportBusy} onClick={toggleSupport}>{supported ? 'Supported' : 'Support this report'} · {supportCount}</Button>{canEdit && !editMode && <Button variant="ghost" onClick={() => setEditMode(true)}>Edit report</Button>}{isStaff && <a className="btn btn-ghost" href="#manage-issue">Manage issue <ArrowUpRight size={15} /></a>}</div></div><div className="detail-hero-side">{issue.photoUrl ? <a className="detail-photo" href={issue.photoUrl} target="_blank" rel="noreferrer"><img src={issue.photoUrl} alt="Issue evidence" /><span><FileImage size={14} /> View evidence</span></a> : <div className="detail-no-photo"><div className="no-photo-sun" /><div className="no-photo-hill" /><div className="no-photo-road" /><MapPin size={22} /><span>No photo attached</span></div>}{mapUrl && <a className="detail-location-link" href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} /> View pinned location <ArrowUpRight size={14} /></a>}</div></section>

    {editMode && <form className="surface-card edit-issue-form" onSubmit={saveEdits}><div className="surface-card-head"><div><h3>Edit your report</h3><p>You can edit while it is still in the submitted stage.</p></div><button className="icon-btn" type="button" onClick={() => setEditMode(false)} aria-label="Close edit form"><X size={17} /></button></div><div className="edit-form-grid"><Field label="Title"><input className="control" required maxLength={120} value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></Field><Field label="Category"><select className="control" value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}>{['ROAD_DAMAGE', 'WASTE', 'STREETLIGHT', 'WATER_LEAK', 'DRAINAGE', 'PUBLIC_SAFETY', 'PARKS', 'OTHER'].map((c) => <option value={c} key={c}>{c.replaceAll('_', ' ')}</option>)}</select></Field><Field label="Address"><input className="control" required maxLength={255} value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} /></Field><Field label="Photo URL"><input className="control" value={editForm.photoUrl} onChange={(e) => setEditForm((p) => ({ ...p, photoUrl: e.target.value }))} placeholder="https://…" /></Field><Field label="Description" className="edit-description-field"><textarea className="control" rows={4} required maxLength={5000} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} /></Field></div><div className="form-actions"><Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button><Button type="submit" loading={editBusy}>Save changes</Button></div></form>}

    <div className="detail-content-grid"><div className="detail-primary-column"><section className="surface-card timeline-card"><div className="surface-card-head"><div><h3>Resolution timeline</h3><p>A transparent history of each status change.</p></div><span className="head-icon"><Activity size={17} /></span></div>{sortedHistory.length ? <div className="timeline">{sortedHistory.map((event, index) => <div className="timeline-item" key={event.id || `${event.toStatus}-${index}`}><div className="timeline-line"><ActivityMarker status={event.toStatus} /></div><div className="timeline-body"><div className="timeline-title-row"><strong>{event.fromStatus ? `${statusLabel(event.fromStatus)} → ${statusLabel(event.toStatus)}` : statusLabel(event.toStatus)}</strong><time>{toLocalDateTime(event.createdAt)}</time></div><p>{event.comment || (index === 0 ? 'Report entered the community register.' : 'Status updated.')}</p><span className="timeline-actor">Updated by {event.changedByName || 'CivicPulse team'}</span></div></div>)}</div> : <EmptyState icon={Clock3} title="No timeline entries" description="Updates will be recorded as the issue moves through the workflow." />}</section>
      <section className="surface-card comments-card"><div className="surface-card-head"><div><h3>Conversation</h3><p>Questions, context and updates about this report.</p></div><span className="comment-count">{comments.length}</span></div>{comments.length ? <div className="comment-list">{comments.map((item) => <article className="comment-item" key={item.id}><div className={`avatar comment-avatar ${item.visibility === 'STAFF_ONLY' ? 'staff-avatar' : ''}`}>{(item.authorName || 'U').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><div className="comment-content"><div className="comment-author-row"><strong>{item.authorName || 'Community member'}</strong>{item.visibility === 'STAFF_ONLY' && <span className="internal-chip"><ShieldCheck size={11} /> Internal note</span>}<time>{formatRelative(item.createdAt)}</time></div><p>{item.message}</p></div></article>)}</div> : <EmptyState icon={MessageCircle} title="Start the conversation" description="Share helpful context or ask for a clarification." />}
        <form className="comment-composer" onSubmit={handleComment}><div className="comment-composer-avatar avatar">{(user?.name || 'U').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div><div className="comment-compose-main"><textarea className="control" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={isStaff ? 'Add a public update or a staff note…' : 'Write a helpful comment…'} maxLength={2000} required /><div className="comment-compose-actions">{isStaff && <label className="check-label"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Staff-only note</label>}<Button type="submit" size="sm" loading={submittingComment} icon={Send}>Post comment</Button></div></div></form>
      </section></div>
      <aside className="detail-side-column"><section className="surface-card detail-info-card"><div className="surface-card-head"><div><h3>Report information</h3><p>Key details at a glance.</p></div></div><div className="detail-info-list"><div><span>Report ID</span><strong>CP-{String(issue.id).padStart(4, '0')}</strong></div><div><span>Category</span><strong><CategoryLabel category={issue.category} /></strong></div><div><span>Submitted</span><strong>{formatDate(issue.createdAt)}</strong></div><div><span>Last updated</span><strong>{formatDate(issue.updatedAt)}</strong></div><div><span>Assigned to</span><strong>{issue.assigneeName || 'Not assigned yet'}</strong></div><div><span>Department</span><strong>{issue.departmentName || 'Pending routing'}</strong></div><div><span>Target date</span><strong className={isOverdue(issue) ? 'overdue-text' : ''}>{formatDate(issue.dueAt)}{isOverdue(issue) && ' · Overdue'}</strong></div>{issue.resolvedAt && <div><span>Resolved</span><strong>{formatDate(issue.resolvedAt)}</strong></div>}</div></section>
        {isStaff && <section className="surface-card manage-card" id="manage-issue"><div className="surface-card-head"><div><h3>Manage issue</h3><p>Update operational fields and keep history current.</p></div><span className="head-icon"><ShieldCheck size={17} /></span></div><form onSubmit={handleStatusUpdate} className="manage-form"><Field label="Update status"><select className="control" value={status} onChange={(e) => setStatus(e.target.value)}><option value={issue.status}>{statusLabel(issue.status)} (current)</option>{(nextStatuses[issue.status] || []).filter((s) => s !== issue.status).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></Field>{status === 'REJECTED' && <Field label="Reason (required)"><textarea className="control" rows={2} value={statusComment} onChange={(e) => setStatusComment(e.target.value)} required placeholder="Explain why the report is being rejected." /></Field>}{status !== 'REJECTED' && <Field label="Update note"><textarea className="control" rows={2} value={statusComment} onChange={(e) => setStatusComment(e.target.value)} placeholder="Add context for the timeline (optional)." /></Field>}<Button type="submit" className="btn-block" loading={updatingStatus} disabled={status === issue.status}>Save status</Button></form><div className="form-separator" /><form onSubmit={handlePriorityUpdate} className="manage-form"><Field label="Priority"><select className="control" value={priority} onChange={(e) => setPriority(e.target.value)}>{priorities.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field><Button type="submit" variant="secondary" className="btn-block" loading={updatingPriority} disabled={priority === issue.priority || ['RESOLVED', 'REJECTED'].includes(issue.status)}>Update priority</Button></form>{isAdmin && <><div className="form-separator" /><form onSubmit={handleAssign} className="manage-form"><Field label="Assign staff member"><select className="control" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required><option value="">Choose staff</option>{staffOptions.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.email}</option>)}</select></Field><Field label="Department"><select className="control" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}><option value="">Keep current department</option>{departments.filter((d) => d.active).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field><Button type="submit" variant="secondary" className="btn-block" loading={assignBusy} disabled={!assigneeId}>Save assignment</Button></form></>}</section>}
        <section className="detail-safety-note"><div><ShieldCheck size={17} /></div><p><strong>Transparent by design</strong>Every status change is recorded. Staff-only notes are visible only to the operations team.</p></section>
      </aside></div>
  </div>;
}
