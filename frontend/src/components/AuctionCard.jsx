import { Link } from 'react-router-dom';
import Button from './Button';
import { useCountdown } from '../hooks/useCountdown';
// Import the shared custom hook to link the card logic cleanly
import { useLiveViewerCount } from '../hooks/useLiveViewerCount';
import './AuctionCard.css';

function AuctionCard({ auction }) {
  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();
  const timeLeft = useCountdown(auction.endsAt, isUpcoming);

  // Consume the custom hook layer to retrieve dynamic real-time metrics
  const targetId = auction.id || auction.auctionId;
  const baselineCount = auction.viewers || auction.watchers || 0;
  const liveViewerCount = useLiveViewerCount(targetId, baselineCount);

  // Helper for better date/time display
  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString([], {
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <article className="auction-card">
      <div className="auction-card__image">
        <div className="auction-card__top">
          <span className={`auction-card__badge ${isUpcoming ? 'auction-card__badge--upcoming' : ''}`}>
            {isUpcoming ? 'Upcoming' : (timeLeft === 'Ended' ? 'Ended' : 'LIVE')}
          </span>
          {/* Render the lightweight dynamic state count */}
          <span className="auction-card__viewers">👁 {liveViewerCount}</span>
        </div>
      </div>
      <div className="auction-card__body">
        <p className="auction-card__host">Hosted by {auction.seller || 'Unknown'}</p>
        <p className="auction-card__category">{auction.category}</p>
        <h3>{auction.title}</h3>
        <p className="auction-card__desc">{auction.category} collector item</p>

        <div className="auction-card__meta">
          <div>
            <span>{isUpcoming ? 'Starting Price' : 'Current Bid'}</span>
            <strong>${auction.currentBid || auction.startingPrice}</strong>
          </div>
          <div>
            <span>{isUpcoming ? 'Starts At' : 'Time left'}</span>
            <strong>
              {isUpcoming && startTimestamp
                ? formatDateTime(startTimestamp) 
                : timeLeft}
            </strong>
          </div>
        </div>
        
        {isUpcoming || timeLeft === 'Ended' ? (
          <Button className="auction-card__cta" disabled={true} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            {timeLeft === 'Ended' ? 'Ended' : 'Not Started'}
          </Button>
        ) : (
          <Link to={`/auction/${auction.id}`}>
            <Button className="auction-card__cta">Join Stream</Button>
          </Link>
        )}
      </div>
    </article>
  );
}

export default AuctionCard;