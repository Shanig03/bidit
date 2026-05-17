import Button from '../ui/Button';
import DashboardTabs from '../ui/DashboardTabs';
import DashboardLiveStreamItem from '../ui/DashboardLiveStreamItem';
import DashboardBidItem from '../ui/DashboardBidItem';
import DashboardWonItem from '../ui/DashboardWonItem';
import './DashboardContent.css';

const tabs = [
  { id: 'live', label: 'Live Auctions' },
  { id: 'bids', label: 'My Bids' },
  { id: 'won', label: 'Won Auctions' },
];

export default function DashboardContent({ activeTab, setActiveTab, liveStreams, isLoadingLiveAuctions, errorMessage, myBids, wonAuctions, onCreateAuction, onViewAuction }) {
  const renderLiveAuctions = () => {
    if (isLoadingLiveAuctions) return <p className="dashboard-message">Loading live auctions...</p>;
    if (errorMessage) return <p className="dashboard-message dashboard-error">{errorMessage}</p>;
    if (liveStreams.length === 0) return <p className="dashboard-message">No live auctions yet.</p>;
    return liveStreams.map((item, index) => <DashboardLiveStreamItem key={item.id} item={item} imageVariant={index + 1} onViewStream={() => onViewAuction(item.id)} onManage={() => onViewAuction(item.id)} />);
  };

  return (
    <>
      <header className="dashboard-header">
        <div><h1>My <span>Dashboard</span></h1><p>Manage your live auctions, bids, and winnings</p></div>
        <Button className="dashboard-cta" onClick={onCreateAuction}>Start New Live Auction</Button>
      </header>
      <section className="dashboard-card card">
        <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="dashboard-content">
          {activeTab === 'live' ? renderLiveAuctions() : activeTab === 'bids' ? myBids.map((item, index) => <DashboardBidItem key={item.id} item={item} imageVariant={index + 1} />) : wonAuctions.map((item, index) => <DashboardWonItem key={item.id} item={item} imageVariant={index + 1} />)}
        </div>
      </section>
    </>
  );
}
