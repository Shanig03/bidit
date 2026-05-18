
import { useEffect, useState } from 'react';
import { getAuctions } from '../api/auctionsApi'; 

function mapAuctionToHomeAuction(auction) {
  return {
    id: auction.auctionId,
    auctionId: auction.auctionId,
    title: auction.title,
    description: auction.description,
    category: auction.category || 'General',
    seller: auction.sellerId || 'Bidit seller',
    sellerId: auction.sellerId,
    currentBid: auction.currentPrice,
    currentPrice: auction.currentPrice,
    startingPrice: auction.startingPrice,
    bidCount: auction.bidCount || 0,
    status: auction.status,
    endsAt: auction.endsAt,
    imageUrl: auction.imageUrl,
  };
}

export function useTrendingAuctions() {
  const [trending, setTrending] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadTrendingAuctions() {
      try {
        setIsLoadingTrending(true);
        setErrorMessage('');

        const apiAuctions = await getAuctions();
        const mappedAuctions = apiAuctions.map(mapAuctionToHomeAuction);

        setTrending(mappedAuctions.slice(0, 3));
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load trending auctions.');
      } finally {
        setIsLoadingTrending(false);
      }
    }

    loadTrendingAuctions();
  }, []);

  return { trending, isLoadingTrending, errorMessage };
}