import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFavoriteAuctions,
  toggleFavoriteAuction,
} from '../api/favoritesService';

export function useFavorites() {
  const { user } = useAuth();
  const userId = user?.uid;

  const [favorites, setFavorites] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState('');

  useEffect(() => {
    async function loadFavorites() {
      if (!userId) {
        setFavorites([]);
        return;
      }

      try {
        setIsLoadingFavorites(true);
        setFavoritesError('');

        // UC-16: Loads the user's saved favorites from DynamoDB through the API.
        const savedFavorites = await getFavoriteAuctions(userId);
        setFavorites(savedFavorites);
      } catch (error) {
        setFavoritesError(error.message || 'Failed to load favorites.');
      } finally {
        setIsLoadingFavorites(false);
      }
    }

    loadFavorites();
  }, [userId]);

  // UC-16: Checks if the favorite button should show as active.
  function isFavorite(auctionId) {
    return favorites.some(
      (favorite) =>
        String(favorite.auctionId || favorite.id) === String(auctionId)
    );
  }

  // UC-16: Adds or removes the auction from favorites, then updates the UI.
  async function toggleFavorite(auction) {
    if (!userId) {
      setFavoritesError('You must be logged in to save favorites.');
      return;
    }

    try {
      setFavoritesError('');

      const nextFavorites = await toggleFavoriteAuction(userId, auction);
      setFavorites(nextFavorites);
    } catch (error) {
      setFavoritesError(error.message || 'Failed to update favorites.');
    }
  }

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoadingFavorites,
    favoritesError,
  };
}