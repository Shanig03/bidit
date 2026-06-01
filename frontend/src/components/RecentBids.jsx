import './RecentBids.css';

function RecentBids({ bids = [] }) {
  const uniqueBids = Array.from(
    new Map(
      bids.map((bid) => [
        bid.bidId || bid.id || `${bid.bidderEmail || bid.bidderId}-${bid.amount}-${bid.createdAt || bid.placedAt}`,
        bid,
      ])
    ).values()
  );

  const getBidderDisplayName = (bid) =>
    bid.username || bid.bidderEmail || bid.bidderId || 'Anonymous bidder';

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

              return (
                <li key={bid.bidId || bid.id}>
                  <span className="avatar" aria-hidden="true">
                    {getAvatarLabel(displayName)}
                  </span>

                  <div className="recent-bids__meta">
                    <p>{displayName}</p>
                    {bid.placedAt || bid.createdAt ? (
                      <small>{bid.placedAt || bid.createdAt}</small>
                    ) : null}
                  </div>

                  <strong>${bid.amount}</strong>
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