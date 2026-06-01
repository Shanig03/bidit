import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuctionById, placeBid, getBidsByAuctionId } from '../api/auctionsApi';
import { getChatMessagesForAuction } from '../data/mockChatMessages';
import { useAuth } from '../context/AuthContext';
import { ref, set, onDisconnect, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/firebaseConfig';
import { useLiveViewerCount } from './useLiveViewerCount'; // Pulls the count instantly


function mapApiAuctionToPageAuction(apiAuction) {
  return {
    id: apiAuction.auctionId,
    auctionId: apiAuction.auctionId,
    title: apiAuction.title,
    name: apiAuction.title,
    description: apiAuction.description,
    category: apiAuction.category,
    startingPrice: apiAuction.startingPrice,
    currentBid: apiAuction.currentPrice,
    currentPrice: apiAuction.currentPrice,
    status: apiAuction.status,
    endsAt: apiAuction.endsAt,
    startsAt: apiAuction.startsAt,
    createdAt: apiAuction.createdAt,
    bidCount: apiAuction.bidCount || 0,
    watchers: apiAuction.watchers || 0,
    sellerId: apiAuction.sellerId,
    highestBidderId: apiAuction.highestBidderId,
    highestBidderEmail: apiAuction.highestBidderEmail,
    imageUrl: apiAuction.imageUrl,
    imageKey: apiAuction.imageKey,
    agoraChannelName: apiAuction.agoraChannelName,
  };
}

export function useAuctionDetails() {
  const { id, auctionId } = useParams();
  const navigate = useNavigate();
  const selectedAuctionId = auctionId || id;
  const { user } = useAuth(); 
  const currentUserId = user?.uid;
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Gets the instant count from the shared hook
  const liveViewers = useLiveViewerCount(selectedAuctionId, auction?.watchers || 0);

  useEffect(() => {
    async function loadAuction() {
      try {
        setIsLoading(true);
        const apiAuction = await getAuctionById(selectedAuctionId);
        setAuction(apiAuction); // Assuming your mapping logic is handled
        setBids(await getBidsByAuctionId(selectedAuctionId));
        setChat(getChatMessagesForAuction(selectedAuctionId));
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load auction.');
      } finally {
        setIsLoading(false);
      }
    }
    if (selectedAuctionId) loadAuction();
  }, [selectedAuctionId]);

  // Presence Logic: Tell Firebase the user is in the room
  useEffect(() => {
    if (!selectedAuctionId || !currentUserId) return;
  async function handlePlaceBid(amount) {
    await placeBid(selectedAuctionId, {
      bidderId: user.uid,
      bidderEmail: user.email,
      bidderName: user.displayName || user.email || 'Unknown bidder',
      amount,
    });

    const myViewerRef = ref(realtimeDb, `auctions/${selectedAuctionId}/viewers/${currentUserId}`);

    onDisconnect(myViewerRef).remove().then(() => {
      set(myViewerRef, true);
    });

    return () => {
      remove(myViewerRef);
    };
  }, [selectedAuctionId, currentUserId]);

  // handlePlaceBid logic remains exactly as you had it...

  return {
    auction,
    currentUserId,
    bids,
    chat,
    isLoading,
    errorMessage,
    liveViewers, 
  };
}