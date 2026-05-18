import Button from './Button';
import './DashboardBidItem.css';

function DashboardBidItem({ item, imageVariant = 1 }) {
  const winning = item.status === 'winning' || item.status === 'leading';

  return (
    <article className="dash-bid-item">
      <div className={`dash-bid-thumb dash-bid-thumb--${imageVariant}`}>
        <span>👁 {item.viewers}</span>
      </div>

      <div className="dash-bid-main">
        <h3>{item.title}</h3>
        <div className="dash-bid-meta">
          <p>
            Your Bid: <strong>${item.myBid}</strong>
          </p>
          <p>
            Current Bid: <strong>${item.currentBid}</strong>
          </p>
          <p>⏱ {item.timeLeft}</p>
        </div>
        <span className={`dash-bid-status ${winning ? 'dash-bid-status--winning' : 'dash-bid-status--outbid'}`}>
          {winning ? 'Winning' : 'Outbid'}
        </span>
      </div>

      <div className="dash-bid-actions">
        <Button>View Auction</Button>
      </div>
    </article>
  );
}

export default DashboardBidItem;
