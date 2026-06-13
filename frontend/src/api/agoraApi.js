// src/api/agoraApi.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getAgoraToken(channelName, uid, isPublisher) {
  // Build the request URL using your unified API Base URL
  const response = await fetch(
  `${API_BASE_URL}/agora/token?channelName=${channelName}&uid=${uid}&isPublisher=${isPublisher}`
);
  
  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(data.error || "Failed to fetch Agora token");
  }

  return data.token;
}