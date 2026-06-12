import PageContainer from './PageContainer';
import DashboardTabs from './DashboardTabs';
import DashboardBidItem from './DashboardBidItem';
import { useDashboard, tabs } from '../hooks/useDashboard';
import './DashboardComp.css';
import AuctionCard from './AuctionCard';
import { useFavorites } from '../hooks/useFavorites';

function isAuctionEnded(auction) {
  const status = auction?.status?.toUpperCase();

  if (status === 'ENDED') {
    return true;
  }

  if (auction?.endsAt) {
    return new Date(auction.endsAt) <= new Date();
  }

  return false;
}

export default function DashboardComp() {
  const {
    activeTab,
    setActiveTab,
    myBids,
    isLoadingBids,
    bidsError,
  } = useDashboard();

  // UC-17: Loads favorites for the My Favorites dashboard tab.
  const { favorites } = useFavorites();

  const activeFavorites = favorites.filter((auction) => !isAuctionEnded(auction));

  // UC-17: Renders active favorite auction cards.
  function renderFavoriteAuctions() {
    if (activeFavorites.length === 0) {
      return <p className="dashboard-message">No active favorite auctions yet.</p>;
    }

    return (
      <div className="dashboard-favorites-grid">
        {activeFavorites.map((auction) => (
          <AuctionCard
            key={auction.id || auction.auctionId}
            auction={auction}
          />
        ))}
      </div>
    );
  }

  // UC-17: Renders the user's bid history tab.
  function renderMyBids() {
    if (isLoadingBids) {
      return <p className="dashboard-message">Loading your bids...</p>;
    }

    if (bidsError) {
      return <p className="dashboard-message dashboard-message--error">{bidsError}</p>;
    }

    if (myBids.length === 0) {
      return <p className="dashboard-message">You have not placed any bids yet.</p>;
    }

    return myBids.map((item, index) => (
      <DashboardBidItem
        key={item.id}
        item={item}
        imageVariant={(index % 2) + 1}
      />
    ));
  }

  return (
    <PageContainer className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>
            My <span>Dashboard</span>
          </h1>
          <p>Manage your favorite auctions and bids</p>
        </div>
      </header>

      <section className="dashboard-card card">
        <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="dashboard-content">
          {activeTab === 'favorites'
            ? renderFavoriteAuctions()
            : renderMyBids()
          }
        </div>
      </section>
    </PageContainer>
  );
}