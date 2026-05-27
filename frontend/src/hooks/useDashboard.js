import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuctions } from '../api/auctionsApi';
import { getUserBids } from '../api/bidsService';
import { useAuth } from '../context/AuthContext';
import { getDashboardItems } from '../data/mockDashboard';

export const tabs = [
  { id: 'favorites', label: 'My Favorites' },
  { id: 'bids', label: 'My Bids' }
];

function mapAuctionToDashboardItem(auction) {
  return {
    id: auction.auctionId,
    auctionId: auction.auctionId,
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
    imageKey: auction.imageKey,
    sellerId: auction.sellerId,
    sellerName: auction.sellerName,
  };
}

function getBidStatus(bid) {
  const auctionStatus = bid.auctionStatus || bid.status;

  if (auctionStatus === 'ENDED') {
    return 'ended';
  }

  if (bid.isWinning === true) {
    return 'winning';
  }

  const myBid = Number(bid.myBid ?? bid.bidAmount ?? bid.amount ?? 0);
  const currentBid = Number(bid.currentBid ?? bid.currentPrice ?? 0);

  return myBid >= currentBid ? 'winning' : 'outbid';
}

function mapBidToDashboardItem(bid) {
  const auctionId = bid.auctionId || bid.id;
  const myBid = bid.myBid ?? bid.bidAmount ?? bid.amount ?? 0;
  const currentBid = bid.currentBid ?? bid.currentPrice ?? bid.auctionCurrentPrice ?? myBid;

  return {
    id: bid.bidId || `${auctionId}-${bid.placedAt || bid.createdAt || myBid}`,
    auctionId,
    title: bid.title || bid.auctionTitle || 'Auction item',
    description: bid.description || '',
    status: getBidStatus(bid),
    auctionStatus: bid.auctionStatus || bid.status || '',
    myBid,
    currentBid,
    currentPrice: currentBid,
    startingPrice: bid.startingPrice || 0,
    viewers: bid.watchers || bid.viewers || 0,
    timeLeft: bid.timeLeft || '',
    endsAt: bid.endsAt || '',
    placedAt: bid.placedAt || bid.createdAt || '',
    imageUrl: bid.imageUrl || '',
    imageKey: bid.imageKey || '',
    category: bid.category || '',
  };
}

export function useDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('favorites');

  const [liveStreams, setLiveStreams] = useState([]);
  const [isLoadingLiveAuctions, setIsLoadingLiveAuctions] = useState(true);

  const [myBids, setMyBids] = useState([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [bidsError, setBidsError] = useState('');

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

  useEffect(() => {
    async function loadMyBids() {
      if (activeTab !== 'bids') {
        return;
      }

      if (!user?.uid) {
        setMyBids([]);
        setBidsError('You must be logged in to view your bids.');
        return;
      }

      try {
        setIsLoadingBids(true);
        setBidsError('');

        const bids = await getUserBids(user.uid);
        setMyBids(bids.map(mapBidToDashboardItem));
      } catch (error) {
        setBidsError(error.message || 'Failed to load your bids.');
        setMyBids([]);
      } finally {
        setIsLoadingBids(false);
      }
    }

    loadMyBids();
  }, [activeTab, user?.uid]);

  function handleCreateAuction() {
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
    isLoadingBids,
    bidsError,

    wonAuctions,

    handleCreateAuction,
    handleViewAuction
  };
}