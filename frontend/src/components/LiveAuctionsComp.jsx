import PageContainer from './PageContainer';
import StatusBadge from './StatusBadge';
import CategoryChip from './CategoryChip';
import AuctionCard from './AuctionCard';
import { useLiveAuctions } from '../hooks/useLiveAuctions';
import './LiveAuctionsComp.css';

const categories = ['All', 'Photography', 'Fashion', 'Music', 'Collectibles', 'Books', 'Electronics'];

export default function LiveAuctionsComp() {
  const {
    filteredAuctions,
    liveAuctionsCount,
    totalAuctions,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    errorMessage
  } = useLiveAuctions();

  return (
    <PageContainer className="live-page">
      <section className="live-hero card">
        <StatusBadge tone="urgent">
          {liveAuctionsCount} Live {liveAuctionsCount === 1 ? 'Auction' : 'Auctions'}
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

      {isLoading && <p className="live-message">Loading live auctions...</p>}
      
      {errorMessage && <p className="live-message live-error">{errorMessage}</p>}
      
      {!isLoading && !errorMessage && filteredAuctions.length === 0 && (
        <p className="live-message">No live auctions found.</p>
      )}

      {!isLoading && !errorMessage && filteredAuctions.length > 0 && (
        <section className="live-grid">
          {filteredAuctions.map((auction, index) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
            />
          ))}
        </section>
      )}
    </PageContainer>
  );
}