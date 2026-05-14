import './AuctionVideoPanel.css';

function AuctionVideoPanel({ auction }) {
  return (
    <section className="avp card">
      <div className="avp-media">
        <div className="avp-top">
          <span className="avp-live">LIVE</span>
          <span className="avp-watch">👁 {auction.watchers} watching</span>
        </div>
        <div className="avp-actions">
          <button type="button">🔊</button>
          <button type="button">⛶</button>
        </div>
        <div className="avp-seller">
          <div className="avp-avatar">👩</div>
          <div>
            <p>
              {auction.seller} <span>Host</span>
            </p>
            <small>⭐ 4.8 · 127 sales</small>
          </div>
        </div>
      </div>
      <h2>Vintage Camera Lens - Canon FD 50mm f/1.4</h2>
    </section>
  );
}

export default AuctionVideoPanel;
