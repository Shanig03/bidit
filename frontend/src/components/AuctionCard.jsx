import { Link } from 'react-router-dom';
import Button from './Button';
import './AuctionCard.css';

function AuctionCard({ auction, endingSoon = false }) {
  console.log("Card received this data:", auction);

  const startTimestamp = auction.startsAt || auction.startTime;
  const isUpcoming = startTimestamp && new Date(startTimestamp) > new Date();
  return (
    <article className="auction-card">
      <div className="auction-card__image">
        <div className="auction-card__top">
          <span className={`auction-card__badge ${endingSoon ? 'auction-card__badge--soon' : ''} ${isUpcoming ? 'auction-card__badge--scheduled' : ''}`}>
            {isUpcoming ? 'Scheduled' : (endingSoon ? 'Ending Soon' : 'LIVE')}
          </span>
          <span className="auction-card__viewers">👁 {auction.watchers}</span>
        </div>
      </div>
      <div className="auction-card__body">
        <p className="auction-card__host">Hosted by {auction.seller}</p>
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
              {isUpcoming && startTimestamp
                ? new Date(startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : (endingSoon ? '45m' : '2h 14m')}
            </strong>
            </div>
        </div>
        {isUpcoming ? (
          <Button className="auction-card__cta" disabled={true}>
            Not Started
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
