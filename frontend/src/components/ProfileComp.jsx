import PageContainer from './PageContainer';
import { useProfile } from '../hooks/useProfile';
import './ProfileComp.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join('');
}

function formatWonDate(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-GB');
}

export default function ProfileComp() {
  const {
    profile,
    formData,
    isEditing,
    isLoadingProfile,
    isSaving,
    statusMessage,
    errorMessage,
    handleStartEdit,
    handleCancelEdit,
    handleChange,
    handleImageChange,
    handleRemoveImage,
    handleSaveProfile,
  } = useProfile();

  const wonAuctions = Array.isArray(profile?.wonAuctions) ? profile.wonAuctions : [];

  if (isLoadingProfile) {
    return (
      <PageContainer className="profile-page">
        <p>Loading profile...</p>
      </PageContainer>
    );
  }

  if (isEditing) {
    return (
      <PageContainer className="profile-page">
        <h1 className="profile-heading-title">Edit Profile</h1>

        <p className="profile-heading-subtitle">
          Update your public profile details.
        </p>

        <section className="card profile-edit-large-card">
          <form className="profile-edit-large-form" onSubmit={handleSaveProfile}>
            <div className="profile-edit-image-area">
              <div className="profile-edit-image-preview">
                {formData.photoURL ? (
                  <img
                    src={formData.photoURL}
                    alt={formData.displayName || 'Profile preview'}
                  />
                ) : (
                  <span>{getInitials(formData.displayName) || 'U'}</span>
                )}
              </div>

              <div className="profile-edit-image-content">
                <h3>Profile Picture</h3>
                <p>Upload a profile image from your computer.</p>

                <div className="profile-image-actions">
                  <label className="profile-upload-btn">
                    Upload Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageChange}
                    />
                  </label>

                  <button
                    type="button"
                    className="profile-remove-image-btn"
                    onClick={handleRemoveImage}
                    disabled={!formData.photoURL}
                  >
                    Remove Image
                  </button>
                </div>

                {formData.imageFile && (
                  <small className="profile-file-name">
                    Selected: {formData.imageFile.name}
                  </small>
                )}
              </div>
            </div>

            <div className="profile-edit-fields-grid">
              <label>
                Full Name
                <input
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </label>

              <label>
                Email Address
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  title="Email will be managed through authentication"
                />
              </label>

              <label className="profile-edit-full-width">
                Bio
                <textarea
                  name="bio"
                  value={formData.bio === 'No bio added yet.' ? '' : formData.bio}
                  onChange={handleChange}
                  placeholder="Write a short bio about yourself"
                  rows={5}
                />
              </label>
            </div>

            {statusMessage && <p className="profile-success">{statusMessage}</p>}
            {errorMessage && <p className="profile-error">{errorMessage}</p>}

            <div className="profile-edit-actions">
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              <button type="button" onClick={handleCancelEdit} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="profile-page">
      <h1 className="profile-heading-title">My Profile</h1>

      <p className="profile-heading-subtitle">
        Manage your account, activity, and preferences.
      </p>

      <div className="profile-layout">
        <aside className="profile-left-col">
          <section className="profile-card card">
            <div className="profile-avatar-wrap">
              {profile.photoURL ? (
                <img
                  className="profile-avatar"
                  src={profile.photoURL}
                  alt={profile.displayName}
                />
              ) : (
                <div className="profile-avatar profile-avatar--fallback" aria-hidden="true">
                  {getInitials(profile.displayName) || 'U'}
                </div>
              )}
            </div>

            <h2>{profile.displayName}</h2>

            <p className="profile-email">{profile.email}</p>

            <p className="profile-empty-text">{profile.bio}</p>

            <button type="button" className="profile-edit-btn" onClick={handleStartEdit}>
              Edit Profile
            </button>
          </section>
        </aside>

        <section className="profile-main-col">
          <div className="profile-activity-stack">
            <article className="card profile-panel profile-auctions-won-panel">
              <div className="profile-panel__header">
                <h3>Auctions Won</h3>
              </div>

              {wonAuctions.length > 0 ? (
                <div className="profile-won-list">
                  {wonAuctions.map((auction) => (
                    <div
                      className="profile-won-item"
                      key={auction.auctionId || auction.id || auction.title}
                    >
                      <div className="profile-won-item__details">
                        <span>{auction.title || 'Auction item'}</span>

                        {auction.wonAt && (
                          <small>Won on {formatWonDate(auction.wonAt)}</small>
                        )}
                      </div>

                      <strong>
                        ${auction.winningBid ?? auction.currentPrice ?? auction.price ?? 0}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-state">
                  <p>You have not won any auctions yet.</p>
                </div>
              )}
            </article>

            <article className="card profile-panel profile-notifications-panel">
              <div className="profile-panel__header">
                <h3>Notifications</h3>
              </div>

              <div className="profile-empty-state">
                <p>No notifications yet.</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}