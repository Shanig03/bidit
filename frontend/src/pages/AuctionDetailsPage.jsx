import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import AuctionVideoPanel from '../components/ui/AuctionVideoPanel';
import BidPanel from '../components/ui/BidPanel';
import RecentBids from '../components/ui/RecentBids';
import LiveChat from '../components/ui/LiveChat';
import ProductDescription from '../components/ui/ProductDescription';
import { getAuctionById, placeBid } from '../api/auctionsApi';
import { getBidsForAuction } from '../data/mockBids';
import { getChatMessagesForAuction } from '../data/mockChatMessages';
import './AuctionDetailsPage.css';

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

function AuctionDetailsPage() {
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
        console.log('selectedAuctionId:', selectedAuctionId);
        console.log('apiAuction from API:', apiAuction);
        const mappedAuction = mapApiAuctionToPageAuction(apiAuction);

        setAuction(mappedAuction);
        setBids(getBidsForAuction(mappedAuction.id));
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

  if (isLoading) {
    return (
      <>
        <Navbar />
        <PageContainer className="auction-details-page">
          <p>Loading auction...</p>
        </PageContainer>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Navbar />
        <PageContainer className="auction-details-page">
          <p style={{ color: 'red' }}>{errorMessage}</p>
        </PageContainer>
      </>
    );
  }

  if (!auction) {
    return (
      <>
        <Navbar />
        <PageContainer className="auction-details-page">
          <p>Auction not found.</p>
        </PageContainer>
      </>
    );
  }

  async function handlePlaceBid(amount) {
    await placeBid(selectedAuctionId, {
      bidderId: 'firebase-buyer-123',
      bidderEmail: 'buyer@example.com',
      amount,
    });

    const updatedAuction = await getAuctionById(selectedAuctionId);
    const mappedAuction = mapApiAuctionToPageAuction(updatedAuction);

    setAuction(mappedAuction);
  }

  return (
    <>
      <Navbar />
      <PageContainer className="auction-details-page">
        <div className="ad-grid">
          <div className="ad-left">
            <AuctionVideoPanel auction={auction} />
            <LiveChat messages={chat} />
            <ProductDescription auction={auction} />
          </div>

          <div className="ad-right">
            <BidPanel
              currentBid={auction.currentBid}
              watchers={auction.watchers}
              auction={auction}
              onPlaceBid={handlePlaceBid}
            />
            <RecentBids bids={bids} />
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export default AuctionDetailsPage;