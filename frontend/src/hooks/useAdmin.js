import { useState, useCallback } from 'react';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../../constants/authConstants';

export function useAdmin() {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.fetchAllUsers(user?.token);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await adminApi.toggleUserBlockStatus(userId, !currentStatus, user?.token);
      setUsers(users.map(u => u.uid === userId ? { ...u, isBlocked: !currentStatus } : u));
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const handleMakeAdmin = async (userId) => {
    if(!window.confirm("Are you sure you want to give this user admin privileges?")) return;
    try {
      await adminApi.promoteUserToAdmin(userId, user?.token);
      setUsers(users.map(u => u.uid === userId ? { ...u, role: USER_ROLES.ADMIN } : u));
    } catch (err) {
      alert("Failed to promote user.");
    }
  };

  const loadAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.fetchAllAuctions(user?.token);
      setAuctions(data.auctions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteAuction = async (auctionId) => {
    if(!window.confirm("Are you sure you want to delete this auction permanently?")) return;
    try {
      await adminApi.deleteAuction(auctionId, user?.token);
      setAuctions(auctions.filter(a => a.auctionId !== auctionId));
    } catch (err) {
      alert("Failed to delete auction.");
    }
  };

  return {
    users,
    auctions,
    loading,
    error,
    loadUsers,
    loadAuctions,
    handleToggleBlock,
    handleMakeAdmin,
    handleDeleteAuction
  };
}