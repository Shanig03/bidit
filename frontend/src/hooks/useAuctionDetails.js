import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAuctionById, placeBid, getBidsByAuctionId } from '../api/auctionsApi';
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

export function useAuctionDetails() {
  const { id, auctionId } = useParams();
  const selectedAuctionId = auctionId || id;

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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

  async function handlePlaceBid(amount) {
    await placeBid(selectedAuctionId, {
      bidderId: 'firebase-buyer-123',
      bidderEmail: 'buyer@example.com',
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
    bids,
    chat,
    isLoading,
    errorMessage,
    handlePlaceBid,
  };
}