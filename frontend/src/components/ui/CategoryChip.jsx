import './CategoryChip.css';

function CategoryChip({ label, active = false }) {
  return <button type="button" className={`category-chip${active ? ' category-chip--active' : ''}`}>{label}</button>;
}

export default CategoryChip;
