import { useCallback, useEffect, useState } from 'react';
import { getAuctionById, placeBid } from '../api/auctionsApi';
import { getBidsForAuction } from '../data/mockBids';
import { getChatMessagesForAuction } from '../data/mockChatMessages';

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

export function useAuctionDetails(selectedAuctionId) {
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAuction = useCallback(async () => {
    if (!selectedAuctionId) return;

    try {
      setErrorMessage('');
      const apiAuction = await getAuctionById(selectedAuctionId);
      const mappedAuction = mapApiAuctionToPageAuction(apiAuction);
      setAuction(mappedAuction);
      setBids(getBidsForAuction(mappedAuction.id));
      setChat(getChatMessagesForAuction(mappedAuction.id));
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load auction.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAuctionId]);

  useEffect(() => {
    let ignore = false;

    async function run() {
      if (!selectedAuctionId || ignore) return;
      await loadAuction();
    }

    run();

    return () => {
      ignore = true;
    };
  }, [loadAuction, selectedAuctionId]);

  const handlePlaceBid = useCallback(async (amount) => {
    await placeBid(selectedAuctionId, {
      bidderId: 'firebase-buyer-123',
      bidderEmail: 'buyer@example.com',
      amount,
    });

    const updatedAuction = await getAuctionById(selectedAuctionId);
    setAuction(mapApiAuctionToPageAuction(updatedAuction));
  }, [selectedAuctionId]);

  return { auction, bids, chat, isLoading, errorMessage, handlePlaceBid };
}
