import Button from './Button';
import { useBidPanel } from '../hooks/useBidPanel';
import './BidPanel.css';

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function BidPanel({ auction, currentBid, watchers = 0, onPlaceBid, favoriteButton }) {
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
  } = useBidPanel(auction, currentBid, watchers, onPlaceBid);

  const auctionStatus = normalizeStatus(auction?.status);

  const isAuctionUpcoming = auctionStatus === 'UPCOMING';
  const isAuctionEnded = auctionStatus === 'ENDED';

  const isBidDisabled = isSubmitting || isAuctionUpcoming || isAuctionEnded;

  function getDisabledReason() {
    if (isAuctionUpcoming) {
      return 'This auction has not started yet.';
    }

    if (isAuctionEnded) {
      return 'This auction has already ended.';
    }

    return '';
  }

  const disabledReason = getDisabledReason();

  return (
    <section className="bid-panel card">
      <p className="bid-panel__label">Current Highest Bid</p>

      <h3 className="bid-panel__amount">${displayCurrentBid}</h3>

      <div className="bid-timer">
        ⏱ Ends at: {auction?.endsAt || 'Not set'}
      </div>

      <input
        className="bid-panel__input"
        placeholder="Enter your bid"
        type="number"
        min={Number(displayCurrentBid) + 1}
        value={bidAmount}
        onChange={(event) => setBidAmount(event.target.value)}
        disabled={isAuctionUpcoming || isAuctionEnded}
      />

      {disabledReason && (
        <p className="bid-panel__message bid-panel__message--muted">
          {disabledReason}
        </p>
      )}

      {errorMessage && (
        <p className="bid-panel__message bid-panel__message--error">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="bid-panel__message bid-panel__message--success">
          {successMessage}
        </p>
      )}

      <div className="bid-actions">
        <Button
          variant="urgent"
          className="bid-place"
          onClick={handleSubmitBid}
          disabled={isBidDisabled}
        >
          {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
        </Button>

        {favoriteButton}
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