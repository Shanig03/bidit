import { Link } from 'react-router-dom';
import Button from './Button';
import { useCountdown } from '../hooks/useCountdown';
import './AuctionCard.css';
import FavoriteButton from './FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';

// Updated display logic within the component
function AuctionCard({ auction }) {
  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();
  const timeLeft = useCountdown(auction.endsAt, isUpcoming);

  const { isFavorite, toggleFavorite } = useFavorites();
  const auctionId = auction.id || auction.auctionId;
  const isEnded = timeLeft === 'Ended' || auction.status === 'ENDED';
  const isAuctionFavorite = isFavorite(auctionId);

  // Helper for better date/time display
  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <article className="auction-card">
      <div className="auction-card__image">
        <div className="auction-card__top">
          {/* Badge Label: Updated to "Upcoming" */}
          <span className={`auction-card__badge ${isUpcoming ? 'auction-card__badge--upcoming' : ''}`}>
            {isUpcoming ? 'Upcoming' : (timeLeft === 'Ended' ? 'Ended' : 'LIVE')}
          </span>
          <span className="auction-card__viewers">👁 {auction.watchers || 0}</span>
        </div>
      </div>
      <div className="auction-card__body">
        <p className="auction-card__host">
          Hosted by {auction.sellerName || auction.seller || auction.sellerEmail || 'Unknown Seller'}
        </p>
        <p className="auction-card__category">{auction.category}</p>
        <h3>{auction.title}</h3>
        
        <div className="auction-card__meta">
          <div>
            {/* Dynamic Price Label: Starting Price vs Current Bid */}
            <span>{isUpcoming ? 'Starting Price' : 'Current Bid'}</span>
            <strong>${auction.currentBid ?? auction.startingPrice}</strong>
          </div>
          <div>
            <span>{isUpcoming ? 'Starts At' : 'Time left'}</span>
            <strong>
              {/* Full Date + Time display */}
              {isUpcoming && startTimestamp
                ? formatDateTime(startTimestamp) 
                : timeLeft}
            </strong>
          </div>
        </div>
        
        <div className="auction-card__actions">
            {isUpcoming || isEnded ? (
              <Button
                className="auction-card__cta"
                disabled={true}
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              >
                {isEnded ? 'Ended' : 'Not Started'}
              </Button>
            ) : (
              <Link to={`/auction/${auctionId}`} className="auction-card__join-link">
                <Button className="auction-card__cta">Join Stream</Button>
              </Link>
            )}

            <FavoriteButton
              active={isAuctionFavorite}
              disabled={isEnded && !isAuctionFavorite}
              onClick={() => toggleFavorite(auction)}
            />
          </div>
      </div>
    </article>
  );
}

export default AuctionCard;