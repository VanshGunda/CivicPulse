import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Bell, Building2, ChevronDown, CircleHelp, ClipboardList, Command, FilePlus2, FileText, LayoutDashboard, Leaf, LogOut, Menu, Search, Settings2, ShieldCheck, Users, X, MapPinned } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationApi } from '../api/civic.js';
import api from '../api/client.js';
import { initials } from '../utils/format.js';
import { useToast } from '../components/Toast.jsx';

const titleMap = {
  '/': ['Overview', 'A clear view of what’s happening in your community.'],
  '/issues': ['Issue explorer', 'Find, filter and follow public reports.'],
  '/issues/new': ['Report an issue', 'Every useful report helps the right team take action.'],
  '/my-reports': ['My reports', 'Follow every issue you’ve raised.'],
  '/assigned': ['Team workspace', 'Manage assigned work and keep the community moving.'],
  '/departments': ['Departments', 'Organize the teams responsible for local services.'],
  '/users': ['People & access', 'Manage CivicPulse accounts and permissions.'],
  '/notifications': ['Notifications', 'Important changes and updates, all in one place.'],
};

export default function AppLayout() {
  const { user, signOut, isStaff, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [unread, setUnread] = useState(0);
  const [apiStatus, setApiStatus] = useState('checking');
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const titleEntry = titleMap[location.pathname] || (location.pathname.startsWith('/issues/') ? ['Report details', 'A transparent timeline from report to resolution.'] : ['CivicPulse', 'A better way to keep communities moving.']);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let alive = true;
    if (user) notificationApi.unreadCount().then((data) => alive && setUnread(data.unreadCount || 0)).catch(() => {});
    return () => { alive = false; };
  }, [user, location.pathname]);

  useEffect(() => {
    let alive = true;
    api.get('/api/health', { timeout: 5000 }).then(() => alive && setApiStatus('online')).catch(() => alive && setApiStatus('offline'));
    return () => { alive = false; };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    navigate(searchValue.trim() ? `/issues?q=${encodeURIComponent(searchValue.trim())}` : '/issues');
  }

  function logout() {
    signOut();
    notify('You have signed out safely.', 'info');
    navigate('/login', { replace: true });
  }

  const navLink = (to, Icon, label, exact = false) => <NavLink to={to} end={exact} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.9} /><span>{label}</span></NavLink>;

  return <div className="app-frame">
    {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand-row"><NavLink to="/" className="brand"><span className="brand-mark"><Leaf size={20} /></span><span>Civic<span>Pulse</span></span></NavLink><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
      <div className="workspace-switch"><div className="workspace-symbol"><MapPinned size={17} /></div><div className="workspace-copy"><strong>Community hub</strong><small>Public services</small></div><ChevronDown size={14} /></div>
      <div className="nav-section-label">WORKSPACE</div>
      <nav className="side-nav">
        {navLink('/', LayoutDashboard, 'Overview', true)}
        {navLink('/issues', ClipboardList, 'Explore reports')}
        {navLink('/my-reports', FileText, 'My reports')}
        {isStaff && navLink('/assigned', Activity, 'Team workspace')}
      </nav>
      <div className="nav-section-label nav-label-spaced">TAKE ACTION</div>
      <nav className="side-nav">
        {navLink('/issues/new', FilePlus2, 'Report an issue')}
        {navLink('/notifications', Bell, <span className="nav-label-with-count">Notifications{unread > 0 && <span className="nav-count">{unread > 9 ? '9+' : unread}</span>}</span>)}
      </nav>
      {isAdmin && <><div className="nav-section-label nav-label-spaced">ADMINISTRATION</div><nav className="side-nav">{navLink('/departments', Building2, 'Departments')}{navLink('/users', Users, 'People & access')}</nav></>}
      <div className="sidebar-bottom"><div className="impact-card"><div className="impact-icon"><Leaf size={17} /></div><strong>Small actions.<br />Real change.</strong><p>Every report moves a neighborhood forward.</p><div className="impact-streak"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div></div><button className="sidebar-help" onClick={() => notify('Need help? Review the project README for setup and API details.', 'info')}><CircleHelp size={17} /><span>Help & support</span><span className="help-shortcut">?</span></button></div>
    </aside>

    <div className="app-main">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{titleEntry[0]}</strong></div></div>
        <div className="topbar-right"><form className="global-search" onSubmit={handleSearch}><Search size={17} /><input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search reports…" aria-label="Search reports" /><kbd><Command size={11} /> K</kbd></form><button className="top-icon-btn notification-trigger" onClick={() => navigate('/notifications')} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}><Bell size={19} />{unread > 0 && <span className="notification-dot" />}</button><div className="topbar-divider" /><div className="profile-anchor"><button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}><span className="avatar">{initials(user?.name)}</span><span className="profile-trigger-copy"><strong>{user?.name || 'Civic user'}</strong><small>{user?.role || 'RESIDENT'}</small></span><ChevronDown size={15} /></button>{profileOpen && <div className="profile-menu"><div className="profile-menu-head"><span className="avatar avatar-lg">{initials(user?.name)}</span><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div><div className="profile-menu-role"><ShieldCheck size={14} /> Signed in as {user?.role?.toLowerCase()}</div><button onClick={logout} className="profile-menu-action"><LogOut size={16} /> Sign out</button></div>}</div></div>
      </header>
      <div className="page-context"><div><div className="context-kicker"><span className="context-pulse" /> YOUR CIVIC WORKSPACE</div><h2>{titleEntry[0]}</h2><p>{titleEntry[1]}</p></div><div className="context-date"><span>Today</span><strong>{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</strong></div></div>
      <main className="page-content"><Outlet /></main>
      <footer className="app-footer"><span>© 2026 CivicPulse <span className="footer-dot">·</span> Better neighborhoods, together.</span><span><span className={`api-status-dot ${apiStatus === 'offline' ? 'offline' : apiStatus === 'checking' ? 'checking' : ''}`} />{apiStatus === 'online' ? 'API connected' : apiStatus === 'offline' ? 'API unreachable' : 'Checking API…'}</span></footer>
    </div>
  </div>;
}
