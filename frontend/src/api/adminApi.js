const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const adminApi = {
  fetchAllUsers: async (token) => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  toggleUserBlockStatus: async (userId, isBlocked, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isBlocked })
    });
    if (!response.ok) throw new Error('Failed to update user status');
    return response.json();
  },

  promoteUserToAdmin: async (userId, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: 'admin' })
    });
    if (!response.ok) throw new Error('Failed to promote user');
    return response.json();
  },


  
  fetchAllAuctions: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auctions`, {
      headers: { 'Authorization': `Bearer ${token}` } 
    });
    if (!response.ok) throw new Error('Failed to fetch auctions');
    return response.json();
  },

  deleteAuction: async (auctionId, token) => {
    const response = await fetch(`${API_BASE_URL}/admin/auctions/${auctionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete auction');
    return response.json();
  }
};