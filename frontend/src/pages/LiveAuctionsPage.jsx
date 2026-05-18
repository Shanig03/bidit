import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import PageContainer from '../components/PageContainer';
import StatusBadge from '../components/StatusBadge';
import CategoryChip from '../components/CategoryChip';
import AuctionCard from '../components/AuctionCard';
import { getAuctions } from '../api/auctionsApi';
import './LiveAuctionsPage.css';

const categories = ['All', 'Photography', 'Fashion', 'Music', 'Collectibles', 'Books', 'Electronics'];

function mapAuctionToCardAuction(auction) {
  return {
    id: auction.auctionId,
    auctionId: auction.auctionId,

    title: auction.title,
    name: auction.title,
    description: auction.description,
    category: auction.category,

    currentBid: auction.currentPrice,
    currentPrice: auction.currentPrice,
    startingPrice: auction.startingPrice,

    bidCount: auction.bidCount || 0,
    totalBids: auction.bidCount || 0,
    bids: auction.bidCount || 0,

    status: auction.status,
    endsAt: auction.endsAt,
    timeLeft: auction.endsAt,

    imageUrl: auction.imageUrl,
    sellerId: auction.sellerId,

    viewers: auction.viewers || 0,
    watchers: auction.watchers || 0,
  };
}

function LiveAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadAuctions() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const apiAuctions = await getAuctions();
        const mappedAuctions = apiAuctions.map(mapAuctionToCardAuction);

        setAuctions(mappedAuctions);
      } catch (error) {
        setErrorMessage(error.message || 'Failed to load live auctions.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAuctions();
  }, []);

  const filteredAuctions = auctions.filter((auction) => {
    const matchesCategory =
      selectedCategory === 'All' || auction.category === selectedCategory;

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matchesSearch =
      normalizedSearch === '' ||
      auction.title?.toLowerCase().includes(normalizedSearch) ||
      auction.description?.toLowerCase().includes(normalizedSearch) ||
      auction.category?.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />

      <PageContainer className="live-page">
        <section className="live-hero card">
          <StatusBadge tone="urgent">
            {auctions.length} Live {auctions.length === 1 ? 'Auction' : 'Auctions'}
          </StatusBadge>

          <h1>
            Live Video <span>Auctions</span>
          </h1>

          <p>Watch sellers showcase products on live video and place your bids in real-time</p>
        </section>

        <section className="live-filter card">
          <div className="live-search-row">
            <input
              placeholder="Search products, categories, or sellers"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <button type="button">Filters</button>
          </div>

          <div className="live-chip-row">
            {categories.map((category) => (
              <CategoryChip
                key={category}
                label={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>
        </section>

        {isLoading && (
          <p className="live-message">Loading live auctions...</p>
        )}

        {errorMessage && (
          <p className="live-message live-error">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && filteredAuctions.length === 0 && (
          <p className="live-message">No live auctions found.</p>
        )}

        {!isLoading && !errorMessage && filteredAuctions.length > 0 && (
          <section className="live-grid">
            {filteredAuctions.map((auction, index) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                endingSoon={index === 1}
              />
            ))}
          </section>
        )}
      </PageContainer>
    </>
  );
}

export default LiveAuctionsPage;