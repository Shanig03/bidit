import { useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import AdminUsersComp from '../components/AdminUsersComp';


export default function AdminUsersPage() {
  const { 
    users, 
    loading, 
    error, 
    loadUsers, 
    handleToggleBlock, 
    handleMakeAdmin 
  } = useAdmin();


  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) return <div className="admin-page">Loading users...</div>;
  if (error) return <div className="admin-page error">{error}</div>;

  return (
    <div className="admin-page">
      <h1>Manage Users</h1>
      <AdminUsersComp 
        users={users} 
        onToggleBlock={handleToggleBlock} 
        onMakeAdmin={handleMakeAdmin} 
      />
    </div>
  );
}