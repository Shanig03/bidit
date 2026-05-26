import PageContainer from './PageContainer';
import Button from './Button';
import DashboardTabs from './DashboardTabs';
import DashboardLiveStreamItem from './DashboardLiveStreamItem';
import DashboardBidItem from './DashboardBidItem';
import DashboardWonItem from './DashboardWonItem';
import { useDashboard, tabs } from '../hooks/useDashboard';
import './DashboardComp.css';
import { Link } from 'react-router-dom';
import AuctionCard from './AuctionCard';
import { useFavorites } from '../hooks/useFavorites';


export default function DashboardComp() {
  const {
    activeTab,
    setActiveTab,
    liveStreams,
    isLoadingLiveAuctions,
    errorMessage,
    myBids,
    wonAuctions,
    handleCreateAuction,
    handleViewAuction
  } = useDashboard();

  const { favorites } = useFavorites();

  function renderFavoriteAuctions() {
    if (favorites.length === 0) {
      return <p className="dashboard-message">No favorite auctions yet.</p>;
    }

    return (
      <div className="dashboard-favorites-grid">
        {favorites.map((auction) => (
          <AuctionCard
            key={auction.id || auction.auctionId}
            auction={auction}
          />
        ))}
      </div>
    );
  }

  return (
    <PageContainer className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>
            My <span>Dashboard</span>
          </h1>
          <p>Manage your live auctions, bids, and winnings</p>
        </div>
      </header>

      <section className="dashboard-card card">
        <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="dashboard-content">
          {activeTab === 'favorites'
            ? renderFavoriteAuctions()
            : activeTab === 'bids'
              ? myBids.map((item, index) => (
                  <DashboardBidItem
                    key={item.id}
                    item={item}
                    imageVariant={index + 1}
                  />
                ))
              : wonAuctions.map((item, index) => (
                  <DashboardWonItem
                    key={item.id}
                    item={item}
                    imageVariant={index + 1}
                  />
                ))}
        </div>
      </section>
    </PageContainer>
  );
}