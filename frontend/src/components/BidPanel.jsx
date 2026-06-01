import Button from './Button';
import { useBidPanel } from '../hooks/useBidPanel';
import './BidPanel.css';

// 1. Rename 'watchers' to 'liveViewers' for clarity
function BidPanel({ auction, currentBid, liveViewers = 0, onPlaceBid }) {
  const {
    displayCurrentBid,
    displayStartingPrice,
    displayBidCount,
    displayWatchers,
    bidAmount,
    setBidAmount,
    errorMessage,
    successMessage,
    isSubmitting,
    handleSubmitBid,
  } = useBidPanel(auction, currentBid, liveViewers, onPlaceBid); // 2. Pass it into your hook

  return (
    <section className="bid-panel card">
      <p>Current Highest Bid</p>

      <h3>${displayCurrentBid}</h3>

      <div className="bid-timer">
        ⏱ Ends at: {auction?.endsAt || 'Not set'}
      </div>

      <input
        placeholder="Enter your bid"
        type="number"
        min={Number(displayCurrentBid) + 1}
        value={bidAmount}
        onChange={(event) => setBidAmount(event.target.value)}
      />

      {errorMessage && <p style={{ color: 'red', marginTop: '8px' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green', marginTop: '8px' }}>{successMessage}</p>}

      <div className="bid-actions">
        <Button
          variant="urgent"
          className="bid-place"
          onClick={handleSubmitBid}
          disabled={isSubmitting || auction?.status !== 'LIVE'}
        >
          {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
        </Button>

        <button type="button" className="bid-heart">
          ♡
        </button>
      </div>

      <div className="bid-stats">
        <div>
          <strong>{displayBidCount}</strong>
          <span>Total Bids</span>
        </div>

        <div>
          <strong>${displayStartingPrice}</strong>
          <span>Starting</span>
        </div>

        <div>
          <strong>{displayWatchers}</strong>
          <span>Viewers</span>
        </div>
      </div>
    </section>
  );
}

export default BidPanel;