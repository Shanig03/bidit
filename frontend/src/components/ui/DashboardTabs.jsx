import './DashboardTabs.css';

function DashboardTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="dashboard-tabs" role="tablist" aria-label="Dashboard tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`dashboard-tab${activeTab === tab.id ? ' dashboard-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default DashboardTabs;
