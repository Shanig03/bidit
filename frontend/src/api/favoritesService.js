const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function normalizeFavoritesResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data.favorites || data.items || data.favoriteAuctions || data.auctions || [];
}

// UC-16/UC-17: Reads favorite auction records from the users API.
export async function getFavoriteAuctions(userId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to fetch favorite auctions');
  }

  const favorites = normalizeFavoritesResponse(data);

  return favorites.map((auction) => ({
    ...auction,
    id: auction.id || auction.auctionId,
    auctionId: auction.auctionId || auction.id,
    currentBid: auction.currentBid ?? auction.currentPrice,
    currentPrice: auction.currentPrice ?? auction.currentBid,
  }));
}

// UC-16: Sends the request that creates a favorite record in DynamoDB.
export async function addFavoriteAuction(userId, auction) {
  const auctionId = auction.auctionId || auction.id;

  const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auctionId,
      auction,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to add favorite auction');
  }

  return getFavoriteAuctions(userId);
}

// UC-16: Sends the request that removes a favorite record from DynamoDB.
export async function removeFavoriteAuction(userId, auctionId) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites/${auctionId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to remove favorite auction');
  }

  return getFavoriteAuctions(userId);
}

// UC-16: Chooses add or remove based on the current favorite state.
export async function toggleFavoriteAuction(userId, auction) {
  const favorites = await getFavoriteAuctions(userId);
  const auctionId = auction.auctionId || auction.id;

  const alreadyFavorite = favorites.some(
    (favorite) => (favorite.auctionId || favorite.id) === auctionId
  );

  if (alreadyFavorite) {
    return removeFavoriteAuction(userId, auctionId);
  }

  return addFavoriteAuction(userId, auction);
}