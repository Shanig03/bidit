import { Link } from 'react-router-dom';
import Button from './Button';
import { useCountdown } from '../hooks/useCountdown';
import { useImageViewUrl } from '../hooks/useImageViewUrl';
import './AuctionCard.css';

function AuctionCard({ auction }) {
  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();
  const timeLeft = useCountdown(auction.endsAt, isUpcoming);

  const { imageUrl: presignedImageUrl, isLoadingImage } = useImageViewUrl(auction?.imageKey);

  const imageSrc = presignedImageUrl || auction?.imageUrl || '';
  const auctionId = auction.auctionId || auction.id;
  const displayPrice = auction.currentPrice || auction.currentBid || auction.startingPrice;

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <article className="auction-card">
      <div className="auction-card__image">
        {isLoadingImage ? (
          <div className="auction-card__image-placeholder">Loading image...</div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={auction.title || 'Auction item'}
            className="auction-card__image-el"
          />
        ) : (
          <div className="auction-card__image-placeholder"></div>
        )}

        <div className="auction-card__top">
          <span className={`auction-card__badge ${isUpcoming ? 'auction-card__badge--upcoming' : ''}`}>
            {isUpcoming ? 'Upcoming' : timeLeft === 'Ended' ? 'Ended' : 'LIVE'}
          </span>

          <span className="auction-card__viewers">👁 {auction.watchers || 0}</span>
        </div>
      </div>

      <div className="auction-card__body">
        <p className="auction-card__host">
          Hosted by {auction.sellerName || auction.seller || 'Unknown'}
        </p>

        <p className="auction-card__category">{auction.category}</p>

        <h3>{auction.title}</h3>

        <p className="auction-card__desc">
          {auction.description || `${auction.category || 'Auction'} item`}
        </p>

        <div className="auction-card__meta">
          <div>
            <span>{isUpcoming ? 'Starting Price' : 'Current Bid'}</span>
            <strong>${displayPrice}</strong>
          </div>

          <div>
            <span>{isUpcoming ? 'Starts At' : 'Time left'}</span>
            <strong>
              {isUpcoming && startTimestamp ? formatDateTime(startTimestamp) : timeLeft}
            </strong>
          </div>
        </div>

        {isUpcoming || timeLeft === 'Ended' ? (
          <Button
            className="auction-card__cta"
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            {timeLeft === 'Ended' ? 'Ended' : 'Not Started'}
          </Button>
        ) : (
          <Link to={`/auction/${auctionId}`}>
            <Button className="auction-card__cta">Join Stream</Button>
          </Link>
        )}
      </div>
    </article>
  );
}

export default AuctionCard;