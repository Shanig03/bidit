import { Link } from 'react-router-dom';
import PageContainer from './PageContainer';
import Button from './Button';
import AuctionCard from './AuctionCard';
import { useTrendingAuctions } from '../hooks/useTrendingAuctions';
import './HomeComp.css';
import { FaVideo, FaMoneyBillWave, FaGlobeAmericas } from 'react-icons/fa';

const featureCards = [
  {
    title: 'Live Streaming',
    description: 'Watch sellers showcase products in real time.',
    icon: FaVideo,
    iconClassName: 'home-feature-icon--1',
  },
  {
    title: 'Instant Bidding',
    description: 'Place bids and see results immediately.',
    icon: FaMoneyBillWave,
    iconClassName: 'home-feature-icon--2',
  },
  {
    title: 'Global Community',
    description: 'Connect with buyers and sellers worldwide.',
    icon: FaGlobeAmericas,
    iconClassName: 'home-feature-icon--3',
  },
];

export default function HomeComp() {
  const { trending, isLoadingTrending, errorMessage } = useTrendingAuctions();

  return (
    <PageContainer className="home-page">
      {/* UC-06: Home hero section with the main project message. */}
      <section className="home-hero card">
        <h1 className="home-title">
          Bid <span>live.</span>
          <br />
          Win fast.
        </h1>

        <p className="home-subtitle">
          Watch sellers showcase amazing items in live video streams.
          <br />
          Place real-time bids and win incredible products from around the world.
        </p>

        {/* UC-06: CTA buttons take users to live auctions or auction creation. */}
        <div className="home-cta-row">
          <Link to="/auctions">
            <Button>Watch Live Auctions</Button>
          </Link>

          <Link to="/go-live">
            <Button variant="secondary">Start An Auction</Button>
          </Link>
        </div>

        <div className="home-feature-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="home-feature-card">
                <div className={`home-feature-icon ${feature.iconClassName}`}>
                  <Icon />
                </div>

                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* UC-06: Shows the trending live auction cards on the home page. */}
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

        {isLoadingTrending && (
          <p className="home-trending-message">Loading trending auctions...</p>
        )}

        {errorMessage && (
          <p className="home-trending-message" style={{ color: 'red' }}>
            {errorMessage}
          </p>
        )}

        {!isLoadingTrending && !errorMessage && trending.length === 0 && (
          <p className="home-trending-message">No live auctions yet.</p>
        )}

        {!isLoadingTrending && !errorMessage && trending.length > 0 && (
          <div className="home-auction-grid">
            {trending.slice(0, 3).map((auction) => (
              <AuctionCard
                key={auction.auctionId || auction.id}
                auction={auction}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}