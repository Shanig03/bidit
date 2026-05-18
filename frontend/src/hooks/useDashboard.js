
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuctions } from '../api/auctionsApi'; 
import { getDashboardItems } from '../data/mockDashboard'; 

export const tabs = [
  { id: 'live', label: 'Live Auctions' },
  { id: 'bids', label: 'My Bids' },
  { id: 'won', label: 'Won Auctions' },
];

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
  const navigate = useNavigate();

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
        const mappedAuctions = auctions.map(mapAuctionToDashboardItem);

        setLiveStreams(mappedAuctions);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load auctions');
      } finally {
        setIsLoadingLiveAuctions(false);
      }
    }

    loadLiveAuctions();
  }, []);

  function handleCreateAuction() {
    // Note: You might want to change this to '/go-live' based on your routing setup!
    navigate('/create-auction'); 
  }

  function handleViewAuction(auctionId) {
    navigate(`/auction/${auctionId}`);
  }

  return {
    activeTab,
    setActiveTab,
    liveStreams,
    isLoadingLiveAuctions,
    errorMessage,
    myBids,
    wonAuctions,
    handleCreateAuction,
    handleViewAuction
  };
}