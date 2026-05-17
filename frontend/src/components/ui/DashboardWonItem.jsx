import Button from './Button';
import './DashboardWonItem.css';

function DashboardWonItem({ item, imageVariant = 1 }) {
  const delivered = item.status === 'delivered';

  return (
    <article className="dash-won-item">
      <div className={`dash-won-thumb dash-won-thumb--${imageVariant}`} />

      <div className="dash-won-main">
        <h3>{item.title}</h3>
        <p>
          Final Price: <strong>${item.finalPrice}</strong> • {item.wonAgo}
        </p>
        <span className={`dash-won-status ${delivered ? 'dash-won-status--delivered' : 'dash-won-status--paid'}`}>
          {delivered ? 'Delivered' : 'Paid'}
        </span>
      </div>

      <div className="dash-won-actions">
        <Button variant="secondary" className="dash-won-btn">
          {delivered ? 'Pay Now' : 'Track Order'}
        </Button>
      </div>
    </article>
  );
}

export default DashboardWonItem;
