import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import StatusBadge from '../components/ui/StatusBadge';
import CategoryChip from '../components/ui/CategoryChip';
import AuctionCard from '../components/ui/AuctionCard';
import { LIVE_AUCTION_CATEGORIES, useLiveAuctions } from '../hooks/useLiveAuctions';
import './LiveAuctionsPage.css';

function LiveAuctionsPage() {
  const {
    auctions,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    isLoading,
    errorMessage,
    filteredAuctions,
  } = useLiveAuctions();

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
            {LIVE_AUCTION_CATEGORIES.map((category) => (
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
        {!isLoading && !errorMessage && filteredAuctions.length === 0 && <p className="live-message">No live auctions found.</p>}

        {!isLoading && !errorMessage && filteredAuctions.length > 0 && (
          <section className="live-grid">
            {filteredAuctions.map((auction, index) => (
              <AuctionCard key={auction.id} auction={auction} endingSoon={index === 1} />
            ))}
          </section>
        )}
      </PageContainer>
    </>
  );
}

export default LiveAuctionsPage;
