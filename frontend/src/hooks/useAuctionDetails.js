import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuctionById, placeBid, getBidsByAuctionId } from '../api/auctionsApi';
import { getChatMessagesForAuction } from '../data/mockChatMessages';
import { useAuth } from '../context/AuthContext';
import { ref, set, onDisconnect, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/firebaseConfig';
import { useLiveViewerCount } from './useLiveViewerCount';

function normalizeImageKeys(apiAuction) {
  const rawImageKeys = apiAuction?.imageKeys;

  if (Array.isArray(rawImageKeys)) {
    const cleanedKeys = rawImageKeys
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.S) {
          return item.S;
        }

        return '';
      })
      .filter(Boolean);

    if (cleanedKeys.length > 0) {
      return cleanedKeys;
    }
  }

  if (rawImageKeys?.L && Array.isArray(rawImageKeys.L)) {
    const cleanedKeys = rawImageKeys.L
      .map((item) => item?.S || '')
      .filter(Boolean);

    if (cleanedKeys.length > 0) {
      return cleanedKeys;
    }
  }

  if (apiAuction?.imageKey) {
    return [apiAuction.imageKey];
  }

  return [];
}

function mapApiAuctionToPageAuction(apiAuction) {
  const imageKeys = normalizeImageKeys(apiAuction);

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
    sellerName: apiAuction.sellerName,
    sellerEmail: apiAuction.sellerEmail,
    sellerId: apiAuction.sellerId,
    sellerName: apiAuction.sellerName,
    sellerEmail: apiAuction.sellerEmail,
    highestBidderId: apiAuction.highestBidderId,
    highestBidderEmail: apiAuction.highestBidderEmail,
    imageUrl: apiAuction.imageUrl,
    imageKey: apiAuction.imageKey || imageKeys[0] || '',
    imageKeys,
    agoraChannelName: apiAuction.agoraChannelName,
  };
}

export function useAuctionDetails() {
  const { id, auctionId } = useParams();
  const selectedAuctionId = auctionId || id;

  const { user } = useAuth();
  const currentUserId = user?.uid;

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // UC-09: Shows how many users are currently on this auction page.
  const liveViewers = useLiveViewerCount(selectedAuctionId, auction?.watchers || 0);

  useEffect(() => {
    async function loadAuction() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const apiAuction = await getAuctionById(selectedAuctionId);
        const pageAuction = mapApiAuctionToPageAuction(apiAuction);

        console.log('API AUCTION:', apiAuction);
        console.log('PAGE AUCTION IMAGE KEYS:', pageAuction.imageKeys);

        setAuction(pageAuction);
        setBids(await getBidsByAuctionId(selectedAuctionId));
        setChat(getChatMessagesForAuction(selectedAuctionId));
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

  useEffect(() => {
    if (!selectedAuctionId || !currentUserId) {
      return;
    }

    const myViewerRef = ref(
      realtimeDb,
      `auctions/${selectedAuctionId}/viewers/${currentUserId}`
    );

    // UC-09: Adds this user to page presence and removes them on disconnect.
    onDisconnect(myViewerRef).remove().then(() => {
      set(myViewerRef, true);
    });

    return () => {
      remove(myViewerRef);
    };
  }, [selectedAuctionId, currentUserId]);

  // UC-14: Sends the bid to the backend/Lambda so DynamoDB can save it.
  async function handlePlaceBid(amount) {
    if (!user || !selectedAuctionId) {
      throw new Error('You must be logged in to place a bid.');
    }

    await placeBid(selectedAuctionId, {
      bidderId: user.uid,
      bidderEmail: user.email,
      displayName: user.displayName, // <-- Changed to explicitly use displayName
      amount,
    });

    // UC-14/UC-15: Reloads auction price and recent bids after DynamoDB updates.
    const updatedAuction = await getAuctionById(selectedAuctionId);
    const updatedBids = await getBidsByAuctionId(selectedAuctionId);

    setAuction(mapApiAuctionToPageAuction(updatedAuction));
    setBids(updatedBids);
  }

  return {
    auction,
    currentUserId,
    bids,
    chat,
    isLoading,
    errorMessage,
    liveViewers,
    handlePlaceBid,
  };
}