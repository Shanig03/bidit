import './StatusBadge.css';

function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={['status-badge', `status-badge--${tone}`].join(' ')}>{children}</span>;
}

export default StatusBadge;
