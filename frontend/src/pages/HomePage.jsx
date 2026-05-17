import { Link } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { getTrendingAuctions } from '../data/mockAuctions';
import './HomePage.css';

const trustItems = ['Real-time bidding', 'Secure payments', 'Trusted community'];

const featureCards = [
  { title: 'Live Streaming', description: 'Watch sellers showcase products in real time.' },
  { title: 'Instant Bidding', description: 'Place bids and see results immediately.' },
  { title: 'Global Community', description: 'Connect with buyers and sellers worldwide.' },
];

const bottomStats = [
  { title: '100% Secure', subtitle: 'Protected payments' },
  { title: '50K+ Members', subtitle: 'Growing community' },
  { title: '4.9/5 Rating', subtitle: 'From our users' },
  { title: '150+ Countries', subtitle: 'Global marketplace' },
];

function HomePage() {
  const trending = getTrendingAuctions().slice(0, 3);

  return (
    <>
      <Navbar />
      <PageContainer className="home-page">
        <section className="home-hero card">
          <StatusBadge tone="neutral">Live Video Auctions</StatusBadge>
          <h1 className="home-title">
            Bid <span>live.</span>
            <br />
            Win fast.
          </h1>
          <p className="home-subtitle">
            Watch sellers showcase amazing items in live video streams. Place real-time bids and win incredible
            products from around the world.
          </p>

          <div className="home-cta-row">
            <Link to="/auctions">
              <Button>Watch Live Auctions</Button>
            </Link>
            <Link to="/go-live">
              <Button variant="secondary">Start Streaming</Button>
            </Link>
          </div>

          <ul className="home-trust-list">
            {trustItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="home-feature-grid">
            {featureCards.map((feature, index) => (
              <article key={feature.title} className="home-feature-card">
                <div className={`home-feature-icon home-feature-icon--${index + 1}`} />
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-trending">
          <div className="home-trending-header">
            <div>
              <h2>
                Trending <span>Now</span>
              </h2>
              <p>Popular live auctions happening right now</p>
            </div>
            <Link to="/auctions">View all</Link>
          </div>

          <div className="home-auction-grid">
            {trending.map((auction, index) => (
              <article className="home-auction-card" key={auction.id}>
                <div className={`home-auction-image home-auction-image--${index + 1}`} />
                <div className="home-auction-body">
                  <p className="home-auction-category">{auction.category}</p>
                  <h3>{auction.title}</h3>
                  <p className="home-auction-meta">Hosted by {auction.seller}</p>
                  <div className="home-auction-bid">
                    <div>
                      <span>Current bid</span>
                      <strong>${auction.currentBid}</strong>
                    </div>
                    <Link to={`/auction/${auction.id}`}>
                      <Button>Join Live Auction</Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-stats card">
          {bottomStats.map((stat) => (
            <div key={stat.title}>
              <h4>{stat.title}</h4>
              <p>{stat.subtitle}</p>
            </div>
          ))}
        </section>
      </PageContainer>
    </>
  );
}

export default HomePage;
