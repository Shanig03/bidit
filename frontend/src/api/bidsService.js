const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getUserBids(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/bids`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch user bids');
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.bids || [];
}