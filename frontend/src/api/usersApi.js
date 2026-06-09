import { auth } from "../firebase/firebaseConfig"; // Ensure this path points to your config

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to grab the Firebase token for backend verification
async function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function getUserProfile(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'GET',
    headers: await getAuthHeaders(),
  });
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch user profile');
  }

  return data.user;
}

// NEW: Function to handle Google Signups (and standard signups)
export async function createUserProfile(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to create user profile');
  }

  return data;
}

export async function updateUserProfile(userId, profileData) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to update user profile');
  }

  return data.user;
}