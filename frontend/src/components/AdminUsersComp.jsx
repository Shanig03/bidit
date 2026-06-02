import './AdminPanel.css'; 

export default function AdminUsersComp({ users, onToggleBlock, onMakeAdmin }) {
  if (users.length === 0) return <p>No users found.</p>;

  return (
    <div className="admin-table-container card">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.uid}>
              <td>{u.displayName}</td>
              <td>{u.email}</td>
              <td>{u.role || 'user'}</td>
              <td>
                <span className={`status-badge ${u.isBlocked ? 'blocked' : 'active'}`}>
                  {u.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </td>
              <td>
                {u.role !== 'admin' && (
                  <div className="admin-action-group">
                    <button 
                      className={`admin-action-btn ${u.isBlocked ? 'unblock' : 'block'}`}
                      onClick={() => onToggleBlock(u.uid, u.isBlocked)}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button 
                      className="admin-action-btn promote"
                      onClick={() => onMakeAdmin(u.uid)}
                    >
                      Make Admin
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}