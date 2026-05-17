import { useEffect, useState } from 'react';
import { getAuctions } from '../api/auctionsApi';
import { getDashboardItems } from '../data/mockDashboard';

function mapAuctionToDashboardItem(auction) {
  return {
    id: auction.auctionId,
    title: auction.title,
    description: auction.description,
    status: auction.status,
    currentBid: auction.currentPrice,
    currentPrice: auction.currentPrice,
    startingPrice: auction.startingPrice,
    bids: auction.bidCount || 0,
    bidCount: auction.bidCount || 0,
    endsAt: auction.endsAt,
    category: auction.category,
    imageUrl: auction.imageUrl,
    sellerId: auction.sellerId,
  };
}

export function useDashboard() {
  const [activeTab, setActiveTab] = useState('live');
  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoadingLiveAuctions, setIsLoadingLiveAuctions] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const myBids = getDashboardItems('myBids');
  const wonAuctions = getDashboardItems('wonAuctions');

  useEffect(() => {
    async function loadLiveAuctions() {
      try {
        setIsLoadingLiveAuctions(true);
        setErrorMessage('');
        const auctions = await getAuctions();
        setLiveStreams(auctions.map(mapAuctionToDashboardItem));
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load auctions');
      } finally {
        setIsLoadingLiveAuctions(false);
      }
    }

    loadLiveAuctions();
  }, []);

  return { activeTab, setActiveTab, liveStreams, isLoadingLiveAuctions, errorMessage, myBids, wonAuctions };
}
