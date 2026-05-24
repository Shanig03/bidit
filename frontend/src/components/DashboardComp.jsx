import PageContainer from './PageContainer';
import Button from './Button';
import DashboardTabs from './DashboardTabs';
import DashboardLiveStreamItem from './DashboardLiveStreamItem';
import DashboardBidItem from './DashboardBidItem';
import DashboardWonItem from './DashboardWonItem';
import { useDashboard, tabs } from '../hooks/useDashboard';
import './DashboardComp.css';
import { Link } from 'react-router-dom';


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

  function renderLiveAuctions() {
    if (isLoadingLiveAuctions) {
      return <p className="dashboard-message">Loading live auctions...</p>;
    }

    if (errorMessage) {
      return <p className="dashboard-message dashboard-error">{errorMessage}</p>;
    }

    if (liveStreams.length === 0) {
      return <p className="dashboard-message">No live auctions yet.</p>;
    }

    return liveStreams.map((item, index) => (
      <DashboardLiveStreamItem
        key={item.id}
        item={item}
        imageVariant={index + 1}
        onViewStream={() => handleViewAuction(item.id)}
        onManage={() => handleViewAuction(item.id)}
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
          <p>Manage your live auctions, bids, and winnings</p>
        </div>
      </header>

      <section className="dashboard-card card">
        <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="dashboard-content">
          {activeTab === 'live'
            ? renderLiveAuctions()
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