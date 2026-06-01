import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuctionById, placeBid, getBidsByAuctionId } from '../api/auctionsApi';
import { getChatMessagesForAuction } from '../data/mockChatMessages';
import { useAuth } from '../context/AuthContext';

// 1. Import the Firebase Realtime Database tools
import { ref, set, onDisconnect, remove, onValue } from 'firebase/database';
// Make sure this matches whatever you named the export in firebaseConfig.js!
import { realtimeDb } from '../firebase/firebaseConfig';

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
  
  // 2. Add a state to hold the live viewer count
  const [liveViewers, setLiveViewers] = useState(0);

  // Existing Data Fetching Effect
  useEffect(() => {
    async function loadAuction() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const apiAuction = await getAuctionById(selectedAuctionId);
        const mappedAuction = mapApiAuctionToPageAuction(apiAuction);
        const apiBids = await getBidsByAuctionId(selectedAuctionId);

        setAuction(mappedAuction);
        setBids(apiBids);
        setChat(getChatMessagesForAuction(mappedAuction.id));
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load auction.');
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedAuctionId) {
      loadAuction();
    }
  }, [selectedAuctionId]);

  // Existing Redirect Effect
  useEffect(() => {
    if (auction && auction.endsAt) {
      const hasEnded = new Date(auction.endsAt) <= new Date();
      if (hasEnded) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [auction, navigate]);

  // 3. NEW: The Firebase Presence Effect
  useEffect(() => {
    if (!selectedAuctionId || !currentUserId) return;

    // References to the database
    const roomViewersRef = ref(realtimeDb, `auctions/${selectedAuctionId}/viewers`);
    const myViewerRef = ref(realtimeDb, `auctions/${selectedAuctionId}/viewers/${currentUserId}`);

    // A. Set up the safety net (if the user's internet drops, remove them)
    onDisconnect(myViewerRef).remove().then(() => {
      // B. Once the disconnect hook is ready, add the user to the room
      set(myViewerRef, true);
    });

    // C. Listen for changes to the total number of people in the room to update the UI instantly
    const unsubscribeViewers = onValue(roomViewersRef, (snapshot) => {
      // snapshot.size gives you the total number of children (users) in the node
      setLiveViewers(snapshot.size); 
    });

    // D. Cleanup: When the user leaves the page normally, remove them from the room
    return () => {
      remove(myViewerRef);
      unsubscribeViewers(); // Stop listening to changes when we leave
    };
  }, [selectedAuctionId, currentUserId]);

  async function handlePlaceBid(amount) {
    await placeBid(selectedAuctionId, {
      bidderId: currentUserId || 'firebase-buyer-123',
      bidderEmail: user?.email || 'buyer@example.com',
      amount,
    });

    const updatedAuction = await getAuctionById(selectedAuctionId);
    const mappedAuction = mapApiAuctionToPageAuction(updatedAuction);
    const updatedBids = await getBidsByAuctionId(selectedAuctionId);

    setAuction(mappedAuction);
    setBids(updatedBids);
  }

  return {
    auction,
    currentUserId,
    bids,
    chat,
    isLoading,
    errorMessage,
    handlePlaceBid,
    liveViewers, // 4. Export the live viewer count so your components can use it
  };
}