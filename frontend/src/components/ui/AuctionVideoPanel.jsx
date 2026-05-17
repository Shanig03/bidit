import './AuctionVideoPanel.css';

function AuctionVideoPanel({ auction }) {
  return (
    <section className="avp card">
      <div className="avp-media">
        <div className="avp-top">
          <span className="avp-live">{auction?.status || 'LIVE'}</span>
          <span className="avp-watch">👁 {auction?.watchers ?? 0} watching</span>
        </div>

        <div className="avp-actions">
          <button type="button">🔊</button>
          <button type="button">⛶</button>
        </div>

        <div className="avp-seller">
          <div className="avp-avatar">👩</div>
          <div>
            <p>
              Seller <span>Host</span>
            </p>
            <small>{auction?.sellerId || 'Unknown seller'}</small>
          </div>
        </div>
      </div>

      <h2>{auction?.title || 'Auction item'}</h2>
    </section>
  );
}

export default AuctionVideoPanel;