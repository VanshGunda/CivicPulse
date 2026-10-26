import { Activity, AlertTriangle, ArrowUpRight, Clock3, MapPin, ThumbsUp } from 'lucide-react';
import { categoryGlyph, categoryLabel, formatRelative, isOverdue } from '../utils/format';
import { PriorityBadge, StatusBadge } from './UI';
import { Link } from 'react-router-dom';

export function IssueMiniCard({ issue, showReporter = false }) {
  return <Link to={`/issues/${issue.id}`} className="issue-mini-card"><div className={`issue-glyph issue-glyph-${String(issue.category || 'other').toLowerCase()}`}>{categoryGlyph(issue.category)}</div><div className="issue-mini-main"><div className="issue-mini-top"><span className="issue-id">CP-{String(issue.id).padStart(4, '0')}</span><StatusBadge status={issue.status} /></div><strong>{issue.title}</strong><div className="issue-meta-line"><span><MapPin size={13} />{issue.address || 'Location not provided'}</span><span><Clock3 size={13} />{formatRelative(issue.createdAt)}</span></div>{showReporter && <span className="issue-reporter">Reported by {issue.reporterName || 'Resident'}</span>}</div><div className="issue-mini-right"><PriorityBadge priority={issue.priority} />{isOverdue(issue) && <span className="overdue-chip"><AlertTriangle size={12} />Overdue</span>}<span className="mini-support"><ThumbsUp size={13} />{issue.supportCount || 0}</span><ArrowUpRight className="issue-go" size={17} /></div></Link>;
}

export function CategoryIcon({ category }) {
  return <span className={`category-icon category-${String(category || 'other').toLowerCase()}`}>{categoryGlyph(category)}</span>;
}

export function CategoryLabel({ category }) { return <span>{categoryLabel(category)}</span>; }

export function ActivityMarker({ status }) {
  const resolved = status === 'RESOLVED';
  return <span className={`activity-marker ${resolved ? 'resolved' : status === 'REJECTED' ? 'rejected' : ''}`}><Activity size={11} /></span>;
}
