import { useParams } from "react-router-dom";
import "./AuctionPage.css";

const bidHistory = [
  { user: "@maria.design", amount: "$930", time: "2 sec ago" },
  { user: "@wavecart", amount: "$915", time: "11 sec ago" },
  { user: "@altstreet", amount: "$900", time: "18 sec ago" },
];

function AuctionPage() {
  const { auctionId } = useParams();

  return (
    <section className="auction-page">
      <div className="stream-card">
        <div className="stream-top">
          <span className="live-pill">LIVE</span>
          <span>Auction ID: {auctionId}</span>
        </div>
        <div className="stream-player">Seller Stream Preview</div>
      </div>

      <aside className="bid-panel">
        <h1>Vintage Camera Collection</h1>
        <p className="subtitle">Hosted by LensLab Store</p>

        <div className="price-box">
          <small>Current Highest Bid</small>
          <strong>$930</strong>
          <p>Ends in 00:48</p>
        </div>

        <div className="bid-actions">
          <button type="button">+$10 Quick Bid</button>
          <button type="button">+$25 Power Bid</button>
        </div>

        <h2>Recent Bids</h2>
        <ul>
          {bidHistory.map((bid) => (
            <li key={`${bid.user}-${bid.amount}`}>
              <span>{bid.user}</span>
              <strong>{bid.amount}</strong>
              <small>{bid.time}</small>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}

export default AuctionPage;
