import './RecentBids.css';

function RecentBids({ bids }) {
  return (
    <section className="recent-bids card">
      <h3>Recent Bids</h3>
      <ul>
        {bids.map((bid) => (
          <li key={bid.id}>
            <span className="avatar">👤</span>
            <div>
              <p>{bid.username}</p>
              <small>{bid.placedAt}</small>
            </div>
            <strong>${bid.amount}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecentBids;
