export const statusLabel = (value = '') => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const categoryLabel = (value = '') => ({
  ROAD_DAMAGE: 'Road damage', WASTE: 'Waste & sanitation', STREETLIGHT: 'Street lighting',
  WATER_LEAK: 'Water leakage', DRAINAGE: 'Drainage', PUBLIC_SAFETY: 'Public safety', PARKS: 'Parks & public spaces', OTHER: 'Other',
}[value] || statusLabel(value));
export const priorityLabel = (value = '') => statusLabel(value);
export const initials = (name = 'Civic User') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
export const formatDate = (value, options = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options }).format(date);
};
export const formatRelative = (value) => {
  if (!value) return 'Recently';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'Recently';
  const days = Math.floor((Date.now() - time) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(value, { year: undefined });
};
export const compactNumber = (value = 0) => new Intl.NumberFormat('en-IN', { notation: value > 999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
export const toLocalDateTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const categoryGlyph = (category) => ({ ROAD_DAMAGE: '↗', WASTE: '♻', STREETLIGHT: '☼', WATER_LEAK: '≈', DRAINAGE: '⌁', PUBLIC_SAFETY: '✳', PARKS: '♧', OTHER: '＋' }[category] || '＋');
export const isOverdue = (issue) => issue?.dueAt && !['RESOLVED', 'REJECTED'].includes(issue.status) && new Date(issue.dueAt).getTime() < Date.now();
