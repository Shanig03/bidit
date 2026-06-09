import './RecentBids.css';
import { formatNumberWithCommas } from '../utils/numberFormat';

// 1. Helper function to format the ISO date string into a readable format
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

function RecentBids({ bids = [] }) {
  const uniqueBids = Array.from(
    new Map(
      bids.map((bid) => [
        // Added displayName to the fallback key generator
        bid.bidId || bid.id || `${bid.displayName || bid.username || bid.bidderId}-${bid.amount}-${bid.createdAt || bid.placedAt}`,
        bid,
      ])
    ).values()
  );

  const getBidderDisplayName = (bid) => {
    // 2. Put bid.displayName at the absolute front of the line!
    const rawName = bid.displayName || bid.username || bid.bidderName || bid.name || bid.bidderEmail || bid.bidderId || 'Anonymous bidder';
    
    // 3. If it is an email address, split it at the '@' and keep only the prefix
    if (typeof rawName === 'string' && rawName.includes('@')) {
      return rawName.split('@')[0];
    }
    
    return rawName;
  };

  const getAvatarLabel = (name) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  return (
    <section className="recent-bids card">
      <h3>Recent Bids</h3>

      <div className="recent-bids__list-wrap">
        {uniqueBids.length === 0 ? (
          <p className="recent-bids__empty">No bids yet.</p>
        ) : (
          <ul>
            {uniqueBids.map((bid) => {
              const displayName = getBidderDisplayName(bid);
              const timeString = bid.placedAt || bid.createdAt;

              return (
                <li key={bid.bidId || bid.id}>
                  <span className="avatar" aria-hidden="true">
                    {getAvatarLabel(displayName)}
                  </span>

                  <div className="recent-bids__meta">
                    <p>{displayName}</p>
                    {/* 4. Apply the formatter to the timestamp */}
                    {timeString ? (
                      <small>{formatDateTime(timeString)}</small>
                    ) : null}
                  </div>

                  <strong>${formatNumberWithCommas(bid.amount)}</strong>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default RecentBids;