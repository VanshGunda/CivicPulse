import { AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Search, ShieldAlert } from 'lucide-react';

export function PageTitle({ eyebrow, title, description, action, children }) {
  return <div className="page-title-row"><div className="page-title-copy">{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}{children}</div>{action && <div className="page-title-action">{action}</div>}</div>;
}

export function Button({ children, variant = 'primary', size = 'md', icon: Icon, loading, className = '', type = 'button', disabled, ...props }) {
  return <button type={type} className={`btn btn-${variant} btn-${size} ${className}`.trim()} disabled={disabled || loading} {...props}>{loading ? <LoaderCircle className="spin" size={16} /> : Icon ? <Icon size={16} strokeWidth={2.2} /> : null}{children}</button>;
}

export function StatusBadge({ status }) {
  const key = String(status || 'UNKNOWN').toLowerCase();
  const label = key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`status-badge status-${key.replaceAll('_', '-')}`}><span className="status-dot" />{label}</span>;
}

export function PriorityBadge({ priority }) {
  const key = String(priority || 'MEDIUM').toLowerCase();
  return <span className={`priority-badge priority-${key}`}>{key}</span>;
}

export function StatCard({ label, value, helper, icon: Icon, tone = 'green', trend, trendLabel }) {
  return <div className={`stat-card tone-${tone}`}><div className="stat-card-top"><span className="stat-label">{label}</span><span className="stat-icon"><Icon size={19} /></span></div><div className="stat-value">{value ?? '—'}</div><div className="stat-foot">{trend !== undefined ? <span className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>{trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(trend)}%</span> : null}<span>{trendLabel || helper}</span></div></div>;
}

export function LoadingState({ label = 'Loading your workspace…' }) {
  return <div className="state-panel"><span className="loading-orbit"><LoaderCircle size={26} className="spin" /></span><strong>{label}</strong><span className="muted small">This usually takes just a moment.</span></div>;
}

export function ErrorState({ message = 'We couldn’t load this information.', onRetry }) {
  return <div className="state-panel state-error"><span className="state-symbol error"><AlertCircle size={22} /></span><strong>Something needs attention</strong><span className="muted">{message}</span>{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</div>;
}

export function EmptyState({ icon: Icon = Search, title = 'Nothing here yet', description = 'When there is something to show, it will appear here.', action }) {
  return <div className="state-panel empty-state"><span className="state-symbol"><Icon size={23} /></span><strong>{title}</strong><span className="muted">{description}</span>{action}</div>;
}

export function Alert({ type = 'info', children, onClose }) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? ShieldAlert : AlertCircle;
  return <div className={`alert alert-${type}`} role="status"><Icon size={18} /><div>{children}</div>{onClose && <button className="alert-close" onClick={onClose} aria-label="Dismiss">×</button>}</div>;
}

export function Pagination({ page = 0, totalPages = 0, onChange }) {
  if (totalPages <= 1) return null;
  return <div className="pagination"><span className="muted small">Page {page + 1} of {totalPages}</span><div className="pagination-actions"><button className="icon-btn compact" disabled={page <= 0} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><button className="icon-btn compact" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>;
}

export function Field({ label, error, hint, children, className = '' }) {
  return <div className={`field ${className}`}><label>{label}</label>{children}{hint && !error && <span className="field-hint">{hint}</span>}{error && <span className="field-error">{error}</span>}</div>;
}
