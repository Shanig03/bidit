import Button from './Button';
import './BidPanel.css';

function BidPanel({ currentBid = 245, watchers = 342 }) {
  return (
    <section className="bid-panel card">
      <p>Current Highest Bid</p>
      <h3>${currentBid}</h3>
      <div className="bid-timer">⏱ Time left: 02:14:35</div>
      <input placeholder="Enter your bid" />
      <div className="bid-actions">
        <Button variant="urgent" className="bid-place">Place Bid</Button>
        <button type="button" className="bid-heart">♡</button>
      </div>
      <div className="bid-stats">
        <div><strong>127</strong><span>Total Bids</span></div>
        <div><strong>$150</strong><span>Starting</span></div>
        <div><strong>{watchers}</strong><span>Viewers</span></div>
      </div>
    </section>
  );
}

export default BidPanel;
