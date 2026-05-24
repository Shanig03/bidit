import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from './Button';
import { useCountdown } from '../hooks/useCountdown';
import { getImageViewUrl } from '../api/uploadService';
import './AuctionCard.css';

// 1. Updated display logic within the component
function AuctionCard({ auction }) {
  const [imageSrc, setImageSrc] = useState(auction.imageUrl || '');
  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();
  const timeLeft = useCountdown(auction.endsAt, isUpcoming);

  // Helper for better date/time display
  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString([], {
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (auction?.imageKey) {
        try {
          const viewUrl = await getImageViewUrl(auction.imageKey);
          if (isMounted) setImageSrc(viewUrl || '');
          return;
        } catch (error) {
          console.error('Failed to load auction image view URL:', error);
        }
      }

      if (isMounted) setImageSrc(auction?.imageUrl || '');
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [auction?.imageKey, auction?.imageUrl]);

  return (
    <article className="auction-card">
      <div className="auction-card__image">
        {imageSrc ? <img src={imageSrc} alt={auction.title} className="auction-card__image-el" /> : null}
        <div className="auction-card__top">
          {/* Badge Label: Updated to "Upcoming" */}
          <span className={`auction-card__badge ${isUpcoming ? 'auction-card__badge--upcoming' : ''}`}>
            {isUpcoming ? 'Upcoming' : (timeLeft === 'Ended' ? 'Ended' : 'LIVE')}
          </span>
          <span className="auction-card__viewers">👁 {auction.watchers || 0}</span>
        </div>
      </div>
      <div className="auction-card__body">
        <p className="auction-card__host">Hosted by {auction.seller || 'Unknown'}</p>
        <p className="auction-card__category">{auction.category}</p>
        <h3>{auction.title}</h3>
        <p className="auction-card__desc">{auction.category} collector item</p>

        <div className="auction-card__meta">
          <div>
            {/* Dynamic Price Label: Starting Price vs Current Bid */}
            <span>{isUpcoming ? 'Starting Price' : 'Current Bid'}</span>
            <strong>${auction.currentBid || auction.startingPrice}</strong>
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