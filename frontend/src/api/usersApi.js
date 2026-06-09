const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getUserProfile(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch user profile');
  }

  return data.user;
}

export async function updateUserProfile(userId, profileData) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update user profile');
  }

  return data.user;
}

export async function getUserNotifications(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/notifications`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch notifications');
  }

  return data.notifications || [];
}