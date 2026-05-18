import PageContainer from './PageContainer';
import { useAuth } from '../context/AuthContext';
import './ProfileComp.css'; 

const sidebarItems = ['Overview', 'My Bids', 'Won Auctions', 'Watchlist', 'Notifications', 'Security', 'Settings'];

function getDisplayName(user) {
  if (!user) return 'User';
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  return 'User';
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join('');
}

export default function ProfileComp() {
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const identifier = user?.email || 'No email available';
  const stats = [
    { label: 'Active Bids', value: '0' },
    { label: 'Auctions Won', value: '0' },
    { label: 'Watchlist Items', value: '0' },
    { label: 'Seller Score', value: '—' },
  ];

  return (
    <PageContainer className="profile-page">
      <div className="profile-heading-badge">Account Center</div>
      <h1 className="profile-heading-title">My Profile</h1>
      <p className="profile-heading-subtitle">Manage your account, activity, and preferences.</p>

      <div className="profile-layout">
        <aside className="profile-left-col">
          <section className="profile-card card">
            <div className="profile-avatar-wrap">
              {user?.photoURL ? (
                <img className="profile-avatar" src={user.photoURL} alt={displayName} />
              ) : (
                <div className="profile-avatar profile-avatar--fallback" aria-hidden="true">{getInitials(displayName) || 'U'}</div>
              )}
            </div>
            <h2>{displayName}</h2>
            <p className="profile-email">{identifier}</p>
            <p className="profile-empty-text">No bio added yet.</p>
            <button type="button" className="profile-edit-btn">Edit Profile</button>
          </section>

          <section className="profile-sidebar card">
            {sidebarItems.map((item) => (
              <button key={item} type="button" className={`profile-side-item${item === 'Settings' ? ' profile-side-item--active' : ''}`}>
                {item}
              </button>
            ))}
          </section>
        </aside>

        <section className="profile-main-col">
          <div className="profile-stat-grid">
            {stats.map((stat) => (
              <article className="profile-stat card" key={stat.label}>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>

          <div className="profile-info-grid">
            <article className="card profile-panel">
              <div className="profile-panel__header">
                <h3>Personal Information</h3>
                <button type="button">Edit Details</button>
              </div>
              <ul>
                <li><span>Full Name</span><strong>{displayName}</strong></li>
                <li><span>Email Address</span><strong>{identifier}</strong></li>
              </ul>
            </article>

            <article className="card profile-panel">
              <div className="profile-panel__header">
                <h3>Recent Activity</h3>
              </div>
              <p className="profile-empty-text">No recent activity yet.</p>
            </article>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}