import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import Button from '../components/ui/Button';
import DashboardTabs from '../components/ui/DashboardTabs';
import DashboardLiveStreamItem from '../components/ui/DashboardLiveStreamItem';
import DashboardBidItem from '../components/ui/DashboardBidItem';
import DashboardWonItem from '../components/ui/DashboardWonItem';
import { useDashboard } from '../hooks/useDashboard';
import './DashboardPage.css';

const tabs = [
  { id: 'live', label: 'Live Auctions' },
  { id: 'bids', label: 'My Bids' },
  { id: 'won', label: 'Won Auctions' },
];

function DashboardPage() {
  const navigate = useNavigate();
  const { activeTab, setActiveTab, liveStreams, isLoadingLiveAuctions, errorMessage, myBids, wonAuctions } = useDashboard();

  function handleCreateAuction() {
    navigate('/create-auction');
  }

  function handleViewAuction(currentAuctionId) {
    navigate(`/auction/${currentAuctionId}`);
  }

  function renderLiveAuctions() {
    if (isLoadingLiveAuctions) return <p className="dashboard-message">Loading live auctions...</p>;
    if (errorMessage) return <p className="dashboard-message dashboard-error">{errorMessage}</p>;
    if (liveStreams.length === 0) return <p className="dashboard-message">No live auctions yet.</p>;

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
    <>
      <Navbar />
      <PageContainer className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>
              My <span>Dashboard</span>
            </h1>
            <p>Manage your live auctions, bids, and winnings</p>
          </div>

          <Button className="dashboard-cta" onClick={handleCreateAuction}>
            Start New Live Auction
          </Button>
        </header>

        <section className="dashboard-card card">
          <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="dashboard-content">
            {activeTab === 'live'
              ? renderLiveAuctions()
              : activeTab === 'bids'
                ? myBids.map((item, index) => <DashboardBidItem key={item.id} item={item} imageVariant={index + 1} />)
                : wonAuctions.map((item, index) => <DashboardWonItem key={item.id} item={item} imageVariant={index + 1} />)}
          </div>
        </section>
      </PageContainer>
    </>
  );
}

export default DashboardPage;
