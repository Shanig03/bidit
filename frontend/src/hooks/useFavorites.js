import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFavoriteAuctions,
  toggleFavoriteAuction,
} from '../api/favoritesService';

export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';

  const [favorites, setFavorites] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      try {
        setIsLoadingFavorites(true);

        const savedFavorites = await getFavoriteAuctions(userId);
        setFavorites(savedFavorites);
      } finally {
        setIsLoadingFavorites(false);
      }
    }

    loadFavorites();
  }, [userId]);

  function isFavorite(auctionId) {
    return favorites.some(
      (favorite) => (favorite.id || favorite.auctionId) === auctionId
    );
  }

  async function toggleFavorite(auction) {
    const nextFavorites = await toggleFavoriteAuction(userId, auction);
    setFavorites(nextFavorites);
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoadingFavorites,
  };
}