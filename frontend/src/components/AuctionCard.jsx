import { Link } from 'react-router-dom';
import Button from './Button';
import { useCountdown } from '../hooks/useCountdown';
import './AuctionCard.css';

// 1. Removed endingSoon from the props
function AuctionCard({ auction }) {
  console.log("Card received this data:", auction);

  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();

  // 2. The hook does all the heavy lifting now
  const timeLeft = useCountdown(auction.endsAt, isUpcoming);

  return (
    <article className="auction-card">
      <div className="auction-card__image">
        <div className="auction-card__top">
          <span className={`auction-card__badge ${isUpcoming ? 'auction-card__badge--scheduled' : ''}`}>
            {isUpcoming ? 'Scheduled' : (timeLeft === 'Ended' ? 'Ended' : 'LIVE')}
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
            <span>Current Bid</span>
            <strong>${auction.currentBid || auction.startingPrice}</strong>
          </div>
          <div>
            <span>{isUpcoming ? 'Starts At' : 'Time left'}</span>
            <strong>
              {/* 4. Removed the hardcoded '45m' and '2h 14m' completely! */}
              {isUpcoming && startTimestamp
                ? new Date(startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
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