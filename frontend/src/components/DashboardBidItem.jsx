import { Link } from 'react-router-dom';
import Button from './Button';
import { formatNumberWithCommas } from '../utils/numberFormat';
import './DashboardBidItem.css';

function DashboardBidItem({ item, imageVariant = 1 }) {
  const winning = item.status === 'winning' || item.status === 'leading';
  const auctionId = item.auctionId || item.id;

  return (
    <article className="dash-bid-item">
      <div className={`dash-bid-thumb dash-bid-thumb--${imageVariant}`}>
        <span>👁 {item.viewers || 0}</span>
      </div>

      <div className="dash-bid-main">
        <h3>{item.title}</h3>

        <div className="dash-bid-meta">
          <p>
            Your Bid: <strong>${formatNumberWithCommas(item.myBid)}</strong>
          </p>

          <p>
            Current Bid: <strong>${formatNumberWithCommas(item.currentBid)}</strong>
          </p>

          <p>{item.timeLeft || item.auctionStatus || 'Active'}</p>
        </div>

        <span className={`dash-bid-status ${winning ? 'dash-bid-status--winning' : 'dash-bid-status--outbid'}`}>
          {winning ? 'Winning' : 'Outbid'}
        </span>
      </div>

      <div className="dash-bid-actions">
        <Link to={`/auction/${auctionId}`}>
          <Button>View Auction</Button>
        </Link>
      </div>
    </article>
  );
}

export default DashboardBidItem;
