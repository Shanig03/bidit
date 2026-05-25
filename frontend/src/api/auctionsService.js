import { auth } from "../firebase/firebaseConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


async function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function getAuctions() {
  const response = await fetch(`${API_BASE_URL}/auctions`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch auctions");
  }

  return data.auctions;
}

export async function createAuction(auctionData) {
  console.log('Creating auction with data:', auctionData);
  const response = await fetch(`${API_BASE_URL}/auctions`, {
    method: "POST",
    headers: await getAuthHeaders(), 
    body: JSON.stringify(auctionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create auction");
  }

  return data;
}

export async function getAuctionById(auctionId) {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch auction');
  }

  return data.auction;
}

export async function placeBid(auctionId, bidData) {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bid`, {
    method: 'POST',
    headers: await getAuthHeaders(), 
    body: JSON.stringify(bidData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to place bid');
  }

  return data;
}