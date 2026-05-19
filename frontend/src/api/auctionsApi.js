const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getAuctions() {
  const response = await fetch(`${API_BASE_URL}/auctions`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch auctions");
  }

  return data.auctions;
}

export async function createAuction(auctionData) {
  const response = await fetch(`${API_BASE_URL}/auctions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(auctionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create auction");
  }

  return data;
}

export async function getAuctionById(auctionId) {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch auction');
  }

  return data.auction;
}

export async function placeBid(auctionId, bidData) {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bidData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to place bid');
  }

  return data;
}

export async function getBidsByAuctionId(auctionId) {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/bids`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch bids');
  }

  return data.bids || [];
}