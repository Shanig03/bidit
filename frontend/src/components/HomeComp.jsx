import { Link } from 'react-router-dom';
import PageContainer from './PageContainer';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { useTrendingAuctions } from '../hooks/useTrendingAuctions';
import './HomeComp.css';
import { useState, useEffect } from 'react';
import { useImageViewUrl } from '../hooks/useImageViewUrl';

const trustItems = ['Real-time bidding', 'Secure payments', 'Trusted community'];

const featureCards = [
  { title: 'Live Streaming', description: 'Watch sellers showcase products in real time.' },
  { title: 'Instant Bidding', description: 'Place bids and see results immediately.' },
  { title: 'Global Community', description: 'Connect with buyers and sellers worldwide.' },
];

function HomeAuctionCard({ auction, index }) {
  const { imageUrl: presignedImageUrl, isLoadingImage } = useImageViewUrl(auction?.imageKey);

  const imageSrc = (presignedImageUrl || auction?.imageUrl || '').trim();
  const auctionId = auction.auctionId || auction.id;
  const sellerName = auction.sellerName || auction.seller || auction.sellerEmail || 'Unknown Seller';
  const currentBid = auction.currentPrice ?? auction.currentBid ?? auction.startingPrice ?? 0;

  return (
    <article className="home-auction-card">
      <div className={`home-auction-image home-auction-image--${index + 1}`}>
        {!isLoadingImage && imageSrc && (
          <img
            src={imageSrc}
            alt={auction.title || 'Auction item'}
            className="home-auction-image__img"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="home-auction-body">
        <p className="home-auction-category">{auction.category}</p>

        <h3>{auction.title}</h3>

        <p className="home-auction-meta">Hosted by {sellerName}</p>

        <div className="home-auction-bid">
          <div>
            <span>Current bid</span>
            <strong>${currentBid}</strong>
          </div>

          <Link to={`/auction/${auctionId}`}>
            <Button>Join Live Auction</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomeComp() {
  const { trending, isLoadingTrending, errorMessage } = useTrendingAuctions();

  return (
    <PageContainer className="home-page">
      <section className="home-hero card">
        <StatusBadge tone="neutral">Live Video Auctions</StatusBadge>

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

        <div className="home-cta-row">
          <Link to="/auctions">
            <Button>Watch Live Auctions</Button>
          </Link>

          <Link to="/go-live">
            <Button variant="secondary">Start An Auction</Button>
          </Link>
        </div>

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
            {trending.map((auction, index) => (
              <HomeAuctionCard
                key={auction.auctionId || auction.id}
                auction={auction}
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}