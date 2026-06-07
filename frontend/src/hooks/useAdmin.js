import { useState, useCallback } from 'react';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../../constants/authConstants';

function normalizeUser(dbUser) {
  return {
    ...dbUser,
    uid: dbUser.userId,
    role: (dbUser.role || USER_ROLES.USER).toUpperCase(),
    isBlocked: (dbUser.status || 'ACTIVE').toUpperCase() === 'BLOCKED',
  };
}

export function useAdmin() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await adminApi.fetchAllUsers(user?.token);
      const normalizedUsers = (data.users || []).map(normalizeUser);

      setUsers(normalizedUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleToggleBlock = async (userId, currentStatus) => {
    if (!userId) {
      alert('Missing user id.');
      return;
    }

    try {
      const nextStatus = currentStatus ? 'ACTIVE' : 'BLOCKED';

      await adminApi.updateUserStatus(userId, nextStatus, user?.token);

      setUsers((currentUsers) =>
        currentUsers.map((u) =>
          u.userId === userId
            ? {
                ...u,
                status: nextStatus,
                isBlocked: nextStatus === 'BLOCKED',
              }
            : u
        )
      );
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!userId) {
      alert('Missing user id.');
      return;
    }

    if (!window.confirm('Are you sure you want to give this user admin privileges?')) {
      return;
    }

    try {
      await adminApi.updateUserRole(userId, 'ADMIN', user?.token);

      setUsers((currentUsers) =>
        currentUsers.map((u) =>
          u.userId === userId
            ? {
                ...u,
                role: USER_ROLES.ADMIN,
              }
            : u
        )
      );
    } catch (err) {
      alert('Failed to promote user.');
    }
  };

  const loadAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await adminApi.fetchAllAuctions(user?.token);
      setAuctions(data.auctions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteAuction = async (auctionId) => {
    if (!auctionId) {
      alert('Missing auction id.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this auction permanently?')) {
      return;
    }

    try {
      await adminApi.deleteAuction(auctionId, user?.token);

      setAuctions((currentAuctions) =>
        currentAuctions.filter((a) => a.auctionId !== auctionId)
      );
    } catch (err) {
      alert('Failed to delete auction.');
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
    handleDeleteAuction,
  };
}