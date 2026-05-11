import "./DashboardPage.css";

const featuredAuctions = [
  { title: "Limited Sneaker Drop", seller: "KickVault", bid: "$420", timeLeft: "02:13" },
  { title: "Creator Tech Bundle", seller: "StudioCart", bid: "$680", timeLeft: "05:47" },
  { title: "Designer Streetwear Set", seller: "Neon Supply", bid: "$315", timeLeft: "01:05" },
];

function DashboardPage() {
  return (
    <section className="dashboard-page">
      <div className="hero-panel">
        <p className="badge">Live Commerce, Reimagined</p>
        <h1>Bid in real time. Stream products. Shop with energy.</h1>
        <p>
          Bidit transforms online shopping into a social live auction experience
          where every product reveal feels like an event.
        </p>
        <div className="hero-cta-group">
          <button type="button" className="cta-btn primary">Explore Live Rooms</button>
          <button type="button" className="cta-btn secondary">Start Selling</button>
        </div>
      </div>

      <div className="section-header">
        <h2>Trending Live Auctions</h2>
        <span>48 rooms active now</span>
      </div>

      <div className="auction-grid">
        {featuredAuctions.map((auction) => (
          <article className="auction-card" key={auction.title}>
            <div className="video-placeholder">
              <span>LIVE</span>
            </div>
            <h3>{auction.title}</h3>
            <p>Seller: {auction.seller}</p>
            <div className="card-footer">
              <strong>{auction.bid}</strong>
              <small>{auction.timeLeft} left</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;
