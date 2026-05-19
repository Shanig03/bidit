import PageContainer from './PageContainer';
import AuctionVideoPanel from './AuctionVideoPanel';
import BidPanel from './BidPanel';
import RecentBids from './RecentBids';
import LiveChat from './LiveChat';
import ProductDescription from './ProductDescription';
import { useAuctionDetails } from '../hooks/useAuctionDetails';
import './AuctionDetailsComp.css';

export default function AuctionDetailsComp() {
  const {
    auction,
    currentUserId,
    bids,
    chat,
    isLoading,
    errorMessage,
    handlePlaceBid,
  } = useAuctionDetails();

  if (isLoading) {
    return (
      <PageContainer className="auction-details-page">
        <p>Loading auction...</p>
      </PageContainer>
    );
  }

  if (errorMessage) {
    return (
      <PageContainer className="auction-details-page">
        <p style={{ color: 'red' }}>{errorMessage}</p>
      </PageContainer>
    );
  }

  if (!auction) {
    return (
      <PageContainer className="auction-details-page">
        <p>Auction not found.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="auction-details-page">
      <div className="ad-grid">
        <div className="ad-left">
          <AuctionVideoPanel auction={auction} currentUserId={currentUserId}/>
          <LiveChat auctionId={auction.auctionId} />
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
  );
}