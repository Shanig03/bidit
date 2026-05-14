import Button from './Button';
import './DashboardLiveStreamItem.css';

function DashboardLiveStreamItem({ item, imageVariant = 1 }) {
  return (
    <article className="dash-live-item">
      <div className={`dash-live-thumb dash-live-thumb--${imageVariant}`}>
        <span>LIVE</span>
      </div>

      <div className="dash-live-main">
        <h3>{item.title}</h3>
        <div className="dash-live-meta">
          <p>
            Current Bid: <strong>${item.currentBid}</strong>
          </p>
          <p>⏱ {item.timeLeft}</p>
          <p>↗ {item.totalBids} bids</p>
          <p>👁 {item.viewers} viewers</p>
        </div>
      </div>

      <div className="dash-live-actions">
        <Button>View Stream</Button>
        <Button variant="secondary">Manage</Button>
      </div>
    </article>
  );
}

export default DashboardLiveStreamItem;
