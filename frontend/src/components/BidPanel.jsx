import { useState } from 'react';
import Button from './Button';
import './BidPanel.css';

function BidPanel({ auction, currentBid, watchers = 0, onPlaceBid }) {
  const displayCurrentBid = currentBid ?? auction?.currentPrice ?? 0;
  const displayStartingPrice = auction?.startingPrice ?? 0;
  const displayBidCount = auction?.bidCount ?? 0;
  const displayWatchers = watchers ?? auction?.watchers ?? 0;

  const [bidAmount, setBidAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmitBid() {
    setErrorMessage('');
    setSuccessMessage('');

    const numericBid = Number(bidAmount);

    if (!bidAmount || Number.isNaN(numericBid)) {
      setErrorMessage('Please enter a valid bid amount.');
      return;
    }

    if (numericBid <= Number(displayCurrentBid)) {
      setErrorMessage(`Your bid must be higher than $${displayCurrentBid}.`);
      return;
    }

    try {
      setIsSubmitting(true);

      await onPlaceBid(numericBid);

      setSuccessMessage('Bid placed successfully.');
      setBidAmount('');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to place bid.');
    } finally {
      setIsSubmitting(false);
    }
  }

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