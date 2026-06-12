import { useState, useCallback } from 'react';
import { ref, set } from 'firebase/database';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { realtimeDb } from '../firebase/firebaseConfig';
import { USER_ROLES } from '../../constants/authConstants';

function normalizeUser(dbUser) {
  return {
    ...dbUser,
    uid: dbUser.userId,
    role: (dbUser.role || USER_ROLES.USER).toUpperCase(),
    status: (dbUser.status || 'ACTIVE').toUpperCase(),
    isBlocked: (dbUser.status || 'ACTIVE').toUpperCase() === 'BLOCKED',
  };
}

export function useAdmin() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UC-21: Loads the admin user list from the backend.
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

  // UC-21: Blocks or unblocks a user and updates enforcement data.
  const handleToggleBlock = async (userId, currentStatus) => {
    if (!userId) {
      alert('Missing user id.');
      return;
    }

    try {
      const nextStatus = currentStatus ? 'ACTIVE' : 'BLOCKED';

      /*
        1. Update the official source of truth: DynamoDB.
        This is what prevents the user from logging in again later.
      */
      // UC-21: Persists the blocked/active status in DynamoDB through the admin API.
      await adminApi.updateUserStatus(userId, nextStatus, user?.token);

      /*
        2. Update Firebase Realtime Database.
        This is what instantly notifies a user who is already logged in.
        Firebase will create this path automatically if it does not exist yet:
        userStatuses/{userId}
      */
      await set(ref(realtimeDb, `userStatuses/${userId}`), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

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
      console.error('Failed to update user status:', err);
      alert('Failed to update user status.');
    }
  };

  // UC-21: Promotes a normal user to admin.
  const handleMakeAdmin = async (userId) => {
    if (!userId) {
      alert('Missing user id.');
      return;
    }

    if (!window.confirm('Are you sure you want to give this user admin privileges?')) {
      return;
    }

    try {
      await adminApi.updateUserRole(userId, USER_ROLES.ADMIN, user?.token);

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
      console.error('Failed to promote user:', err);
      alert('Failed to promote user.');
    }
  };

  // UC-22: Loads auctions for the admin management page.
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

  // UC-22: Deletes an auction and refreshes the local list.
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
      console.error('Failed to delete auction:', err);
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