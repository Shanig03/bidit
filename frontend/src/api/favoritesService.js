const FAVORITES_STORAGE_PREFIX = 'bidit:favorites';

function getStorageKey(userId) {
  return `${FAVORITES_STORAGE_PREFIX}:${userId || 'guest'}`;
}

export async function getFavoriteAuctions(userId) {
  const savedFavorites = localStorage.getItem(getStorageKey(userId));

  if (!savedFavorites) {
    return [];
  }

  try {
    return JSON.parse(savedFavorites);
  } catch {
    return [];
  }
}

export async function addFavoriteAuction(userId, auction) {
  const favorites = await getFavoriteAuctions(userId);
  const auctionId = auction.id || auction.auctionId;

  const alreadyExists = favorites.some(
    (favorite) => (favorite.id || favorite.auctionId) === auctionId
  );

  if (alreadyExists) {
    return favorites;
  }

  const favoriteAuction = {
    ...auction,
    id: auctionId,
    auctionId,
    savedAt: new Date().toISOString(),
  };

  const nextFavorites = [...favorites, favoriteAuction];

  localStorage.setItem(getStorageKey(userId), JSON.stringify(nextFavorites));

  return nextFavorites;
}

export async function removeFavoriteAuction(userId, auctionId) {
  const favorites = await getFavoriteAuctions(userId);

  const nextFavorites = favorites.filter(
    (favorite) => (favorite.id || favorite.auctionId) !== auctionId
  );

  localStorage.setItem(getStorageKey(userId), JSON.stringify(nextFavorites));

  return nextFavorites;
}

export async function toggleFavoriteAuction(userId, auction) {
  const favorites = await getFavoriteAuctions(userId);
  const auctionId = auction.id || auction.auctionId;

  const alreadyExists = favorites.some(
    (favorite) => (favorite.id || favorite.auctionId) === auctionId
  );

  if (alreadyExists) {
    return removeFavoriteAuction(userId, auctionId);
  }

  return addFavoriteAuction(userId, auction);
}