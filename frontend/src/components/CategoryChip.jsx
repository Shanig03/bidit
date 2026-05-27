import './CategoryChip.css';

function CategoryChip({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      className={`category-chip${active ? ' category-chip--active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default CategoryChip;