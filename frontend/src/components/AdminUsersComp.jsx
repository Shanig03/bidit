import { useMemo, useState } from 'react';
import './AdminPanel.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join('');
}

export default function AdminUsersComp({ users = [], onToggleBlock, onMakeAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const displayName = (user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      return (
        displayName.includes(normalizedSearch) ||
        email.includes(normalizedSearch)
      );
    });
  }, [users, searchTerm]);

  if (users.length === 0) {
    return (
      <section className="admin-empty-card card">
        <h3>No users found</h3>
        <p>There are no users to manage yet.</p>
      </section>
    );
  }

  return (
    <section className="admin-section-card card">
      <div className="admin-section-header">
        <div>
          <h2>Users Management</h2>
          <p>Manage user roles and account access.</p>
        </div>

        <span className="admin-count-badge">
          {filteredUsers.length} / {users.length} users
        </span>
      </div>

      <div className="admin-search-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search users by name or email"
        />

        {searchTerm && (
          <button type="button" onClick={() => setSearchTerm('')}>
            Clear
          </button>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <p className="admin-inline-message">No users match your search.</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="admin-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => {
                const userId = u.userId || u.uid;
                const displayName = u.displayName || 'Unknown user';
                const role = (u.role || 'USER').toUpperCase();
                const isBlocked =
                  u.isBlocked || (u.status || 'ACTIVE').toUpperCase() === 'BLOCKED';
                const isAdmin = role === 'ADMIN';

                return (
                  <tr key={userId}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {getInitials(displayName) || 'U'}
                        </div>

                        <div>
                          <strong>{displayName}</strong>
                          <small>{userId}</small>
                        </div>
                      </div>
                    </td>

                    <td className="admin-muted-cell">{u.email || 'No email'}</td>

                    <td>
                      <span className={`admin-role-badge ${isAdmin ? 'admin' : 'user'}`}>
                        {role}
                      </span>
                    </td>

                    <td>
                      <span className={`admin-status-badge ${isBlocked ? 'blocked' : 'active'}`}>
                        {isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>

                    <td>
                      <div className="admin-action-group">
                        <button
                          type="button"
                          className={`admin-action-btn ${isBlocked ? 'unblock' : 'block'}`}
                          onClick={() => onToggleBlock(userId, isBlocked)}
                        >
                          {isBlocked ? 'Unblock' : 'Block'}
                        </button>

                        {!isAdmin && (
                          <button
                            type="button"
                            className="admin-action-btn promote"
                            onClick={() => onMakeAdmin(userId)}
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}