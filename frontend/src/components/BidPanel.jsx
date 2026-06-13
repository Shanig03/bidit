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

// 1. Helper function to format the ISO date string into a readable format
// UC-13: Formats the auction end time shown beside the bid input.
const formatDateTime = (isoString) => {
  if (!isoString || isoString === 'Not set') return 'Not set';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

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

  // UC-13/UC-14: Disables bidding while submitting or after/before the auction window.
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

  // UC-14: Checks login before allowing the bid submit handler to run.
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

      {/* 2. Replaced the CSS class with neutral inline styling and applied the date formatter */}
      <div style={{ 
        color: '#333', 
        backgroundColor: '#f5f5f5', 
        padding: '10px 15px', 
        borderRadius: '8px', 
        marginBottom: '15px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>⏱</span>
        Ends at: {formatDateTime(auction?.endsAt)}
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
