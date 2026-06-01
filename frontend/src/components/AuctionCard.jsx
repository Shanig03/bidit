import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Button from './Button';
import { useCountdown } from '../hooks/useCountdown';
import { useImageViewUrl } from '../hooks/useImageViewUrl';
import './AuctionCard.css';
import FavoriteButton from './FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';

// Updated display logic within the component
function AuctionCard({ auction }) {
  const startTimestamp = auction?.startsAt || auction?.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();
  const timeLeft = useCountdown(auction?.endsAt, isUpcoming);

  const { imageUrl: presignedImageUrl, isLoadingImage } = useImageViewUrl(auction?.imageKey);

  const imageSrc = (presignedImageUrl || auction?.imageUrl || '').trim();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);
  
  const auctionId = auction.auctionId || auction.id;
  const displayPrice = auction?.currentPrice ?? auction?.currentBid ?? auction?.startingPrice ?? 0;

  const { isFavorite, toggleFavorite } = useFavorites();
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
        {isLoadingImage ? (
            <div className="auction-card__image-placeholder" />
          ) : imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={auction.title || 'Auction item'}
              className="auction-card__image-el"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="auction-card__image-placeholder" />
          )}

        <div className="auction-card__top">
          <span className={`auction-card__badge ${isUpcoming ? 'auction-card__badge--upcoming' : ''}`}>
            {isUpcoming ? 'Upcoming' : isEnded ? 'Ended' : 'LIVE'}
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
        <p className="auction-card__desc">
          {auction.description?.trim() || ''}
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