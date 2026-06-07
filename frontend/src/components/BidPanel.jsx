import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from './Button';
import { useBidPanel } from '../hooks/useBidPanel';
import { formatNumberWithCommas } from '../utils/numberFormat';
import { useAuth } from '../context/AuthContext';
import './BidPanel.css';

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function BidPanel({ auction, currentBid, liveViewers = 0, onPlaceBid, favoriteButton }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMessage, setAuthMessage] = useState('');
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
  } = useBidPanel(auction, currentBid, liveViewers, onPlaceBid); 

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

  function goToLogin() {
    navigate('/login', { state: { from: location } });
  }

  function handleProtectedBid() {
    if (!user) {
      setAuthMessage('You must be logged in to perform this action.');
      return;
    }

    setAuthMessage('');
    handleSubmitBid();
  }

  return (
    <section className="bid-panel card">
      <p className="bid-panel__label">Current Highest Bid</p>

      <h3 className="bid-panel__amount">${formatNumberWithCommas(displayCurrentBid)}</h3>

      <div className="bid-timer">
        ⏱ Ends at: {auction?.endsAt || 'Not set'}
      </div>

      <input
        className="bid-panel__input"
        placeholder="Enter your bid"
        type="text"
        inputMode="numeric"
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

      {authMessage && (
        <div className="bid-panel__auth-notice" role="alert">
          <p>{authMessage}</p>
          <Button variant="secondary" className="bid-panel__login-button" onClick={goToLogin}>
            Log In
          </Button>
        </div>
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
          onClick={handleProtectedBid}
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
          <strong>${formatNumberWithCommas(displayStartingPrice)}</strong>
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
