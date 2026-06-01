import { useNavigate } from 'react-router-dom';
import PageContainer from './PageContainer';
import AuctionVideoPanel from './AuctionVideoPanel';
import BidPanel from './BidPanel';
import RecentBids from './RecentBids';
import LiveChat from './LiveChat';
import ProductDescription from './ProductDescription';
import { useAuctionDetails } from '../hooks/useAuctionDetails';
import './AuctionDetailsComp.css';

export default function AuctionDetailsComp() {
  const navigate = useNavigate();
  const {
    auction,
    currentUserId,
    bids,
    chat,
    isLoading,
    errorMessage,
    handlePlaceBid,
    liveViewers,
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

  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();

  if (isUpcoming) {
    return (
      <PageContainer className="auction-details-page">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>This auction hasn't started yet!</h2>
          <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>
            Scheduled to begin at: <strong>{new Date(startTimestamp).toLocaleString()}</strong>
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#8a2be2', color: 'white' }}
          >
            Go Back to Dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="auction-details-page">
      <div className="ad-grid">
        <div className="ad-left">
          <AuctionVideoPanel auction={auction} currentUserId={currentUserId} liveViewers={liveViewers}/>
          <LiveChat auctionId={auction.auctionId} />
          <ProductDescription auction={auction} />
        </div>

        <div className="ad-right">
          <BidPanel
            currentBid={auction.currentBid}
            liveViewers={liveViewers}
            auction={auction}
            onPlaceBid={handlePlaceBid}
          />
          <RecentBids bids={bids} />
        </div>
      </div>
    </PageContainer>
  );
}