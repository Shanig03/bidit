import { durationOptions } from '../hooks/useGoLive';
import ProductImageUploader from './ProductImageUploader';
import { formatNumericInput } from '../utils/numberFormat';
import './GoLiveComp.css';

export default function GoLiveComp(props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    startingPrice,
    setStartingPrice,
    duration,
    setDuration,
    startTime,
    setStartTime,
    streamQuality,
    setStreamQuality,
    productImageFiles,
    productImagePreviewUrls,
    productImageError,
    serverError,
    successMessage,
    isSubmitting,
    handleProductImageSelect,
    handleRemoveProductImage,
    handleStartAuction,
    handleCancel,
  } = props;

  return (
    <div className="go-live-page">
      <header className="go-live-header">
        <h1>
          Schedule a <span>Live Auction</span>
        </h1>

        <p>Set up your product details and stream settings.</p>
      </header>

      {/* UC-18: Auction form for product, timing, category, and price details. */}
      <form className="go-live-card card" onSubmit={handleStartAuction}>
        {serverError && <p className="error-message">{serverError}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="upload-wrap">
          <label className="upload-title">Product Title</label>

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Vintage Camera"
            required
          />
        </div>

        <div className="upload-wrap">
          <label className="upload-title">Description</label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows="3"
            placeholder="Describe your item..."
          />
        </div>

        <div className="go-live-grid-2">
          <div className="upload-wrap">
            <label className="upload-title">Starting Price ($)</label>

            <input
              type="text"
              inputMode="numeric"
              value={startingPrice}
              onChange={(event) => setStartingPrice(formatNumericInput(event.target.value))}
              min="1"
              required
            />
          </div>

          <div className="upload-wrap">
            <label className="upload-title">Category</label>

            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="Electronics">Electronics</option>
              <option value="Collectibles">Collectibles</option>
              <option value="Fashion">Fashion</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Art">Art</option>
              <option value="Home">Home</option>
              <option value="Beauty">Beauty</option>
              <option value="Books">Books</option>
              <option value="Sports">Sports</option>
              <option value="Toys">Toys</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="go-live-grid-2">
          <div className="upload-wrap">
            <label className="upload-title">Start Date & Time</label>

            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </div>

          <div className="upload-wrap">
            <label className="upload-title">Auction Duration</label>

            <select value={duration} onChange={(event) => setDuration(event.target.value)}>
              {durationOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* UC-18: Multi-image selector with previews before uploading. */}
        <ProductImageUploader
          selectedFiles={productImageFiles}
          previewUrls={productImagePreviewUrls}
          maxFiles={6}
          onFilesSelect={handleProductImageSelect}
          onRemove={handleRemoveProductImage}
          disabled={isSubmitting}
          errorMessage={productImageError}
        />

        <div className="go-live-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="go-live-submit btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Scheduling...' : 'Create Auction'}
          </button>
        </div>
      </form>
    </div>
  );
}
