import { useEffect, useState } from 'react';
import { getAuctions } from '../api/auctionsApi'; 

function mapAuctionToHomeAuction(auction) {
  return {
    id: auction.auctionId,
    auctionId: auction.auctionId,
    title: auction.title,
    description: auction.description,
    category: auction.category || 'General',
    seller: auction.sellerName || auction.seller || auction.sellerEmail || auction.sellerId || 'Bidit seller',
    sellerName: auction.sellerName,
    sellerEmail: auction.sellerEmail,
    sellerId: auction.sellerId,
    currentBid: auction.currentPrice,
    currentPrice: auction.currentPrice,
    startingPrice: auction.startingPrice,
    bidCount: auction.bidCount || 0,
    status: auction.status,
    endsAt: auction.endsAt,
    imageUrl: auction.imageUrl || '',
    imageKey: auction.imageKey || '',
    imageUrl: auction.imageUrl,
    // Add viewers here so the sorting logic has access to it
    viewers: auction.viewers || auction.watchers || 0, 
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

        // 1. Filter for only 'LIVE' auctions
        const liveAuctions = mappedAuctions.filter(auction => auction.status === 'LIVE');

        // 2. Sort by viewers descending (b - a)
        const sortedByViewers = liveAuctions.sort((a, b) => b.viewers - a.viewers);

        // 3. Keep only the top 3
        const top3Trending = sortedByViewers.slice(0, 3);

        setTrending(top3Trending);
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