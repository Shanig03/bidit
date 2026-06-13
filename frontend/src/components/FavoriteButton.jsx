import './FavoriteButton.css';

// UC-16: Favorite button shows saved state and triggers add/remove.
function FavoriteButton({ active, disabled = false, onClick }) {
  return (
    <button
      type="button"
      className={`favorite-button${active ? ' favorite-button--active' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={
        disabled
          ? 'Ended auctions cannot be added to favorites'
          : active
            ? 'Remove from favorites'
            : 'Add to favorites'
      }
    >
      {active ? '♥' : '♡'}
    </button>
  );
}

export default FavoriteButton;