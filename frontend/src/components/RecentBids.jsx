import './RecentBids.css';

function RecentBids({ bids }) {
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
        <ul>
          {bids.map((bid) => {
            const displayName = getBidderDisplayName(bid);

            return (
              <li key={bid.id}>
                <span className="avatar" aria-hidden="true">
                  {getAvatarLabel(displayName)}
                </span>
                <div className="recent-bids__meta">
                  <p>{displayName}</p>
                  {bid.placedAt ? <small>{bid.placedAt}</small> : null}
                </div>
                <strong>${bid.amount}</strong>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="recent-bids__list-wrap">
        <ul>
          {bids.map((bid) => {
            const displayName = getBidderDisplayName(bid);

            return (
              <li key={bid.id}>
                <span className="avatar" aria-hidden="true">
                  {getAvatarLabel(displayName)}
                </span>
                <div className="recent-bids__meta">
                  <p>{displayName}</p>
                  {bid.placedAt ? <small>{bid.placedAt}</small> : null}
                </div>
                <strong>${bid.amount}</strong>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default RecentBids;
