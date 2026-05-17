import { useParams } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import AuctionVideoPanel from '../components/ui/AuctionVideoPanel';
import BidPanel from '../components/ui/BidPanel';
import RecentBids from '../components/ui/RecentBids';
import LiveChat from '../components/ui/LiveChat';
import ProductDescription from '../components/ui/ProductDescription';
import { useAuctionDetails } from '../hooks/useAuctionDetails';
import './AuctionDetailsPage.css';

function AuctionDetailsPage() {
  const { id, auctionId } = useParams();
  const selectedAuctionId = auctionId || id;
  const { auction, bids, chat, isLoading, errorMessage, handlePlaceBid } = useAuctionDetails(selectedAuctionId);

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
            <BidPanel currentBid={auction.currentBid} watchers={auction.watchers} auction={auction} onPlaceBid={handlePlaceBid} />
            <RecentBids bids={bids} />
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export default AuctionDetailsPage;
