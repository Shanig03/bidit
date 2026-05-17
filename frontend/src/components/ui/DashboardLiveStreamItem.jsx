import Button from './Button';
import './DashboardLiveStreamItem.css';

function DashboardLiveStreamItem({ item, imageVariant = 1, onViewStream, onManage }) {
  return (
    <article className="dash-live-item">
      <div className={`dash-live-thumb dash-live-thumb--${imageVariant}`}>
        <span>{item.status || 'LIVE'}</span>
      </div>

      <div className="dash-live-main">
        <h3>{item.title}</h3>

        {item.description && <p className="dash-live-description">{item.description}</p>}

        <div className="dash-live-meta">
          <p>
            Current Bid: <strong>${item.currentBid ?? item.currentPrice ?? 0}</strong>
          </p>

          <p>⏱ Ends at: {item.endsAt || 'Not set'}</p>

          <p>↗ {item.totalBids ?? item.bidCount ?? item.bids ?? 0} bids</p>

          <p>👁 {item.viewers ?? 0} viewers</p>
        </div>
      </div>

      <div className="dash-live-actions">
        <Button onClick={onViewStream}>View Stream</Button>

        <Button variant="secondary" onClick={onManage}>
          Manage
        </Button>
      </div>
    </article>
  );
}

export default DashboardLiveStreamItem;