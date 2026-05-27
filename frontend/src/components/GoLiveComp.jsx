import { durationOptions } from '../hooks/useGoLive';
import ProductImageUploader from './ProductImageUploader';
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
      productImageFile,
      productImagePreviewUrl,
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
        <h1>Schedule a <span>Live Auction</span></h1>
        <p>Set up your product details and stream settings.</p>
      </header>

      <form className="go-live-card card" onSubmit={handleStartAuction}>
        {serverError && <p className="error-message">{serverError}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div className="upload-wrap">
          <label className="upload-title">Product Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. Vintage Camera"
            required 
          />
        </div>

        <div className="upload-wrap">
          <label className="upload-title">Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Describe your item..."
          />
        </div>

        <div className="go-live-grid-2">
          <div className="upload-wrap">
            <label className="upload-title">Starting Price ($)</label>
            <input 
              type="number" 
              value={startingPrice} 
              onChange={(e) => setStartingPrice(e.target.value)} 
              min="1"
              required 
            />
          </div>

          <div className="upload-wrap">
            <label className="upload-title">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
              onChange={(e) => setStartTime(e.target.value)} 
              required
            />
          </div>

          <div className="upload-wrap">
            <label className="upload-title">Auction Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {durationOptions.map(opt => (
                <option key={opt.label} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>


        <ProductImageUploader
          selectedFile={productImageFile}
          previewUrl={productImagePreviewUrl}
          onFileSelect={handleProductImageSelect}
          onRemove={handleRemoveProductImage}
          disabled={isSubmitting}
          errorMessage={productImageError}
        />

        {/* Using your specific stream-setup styling classes here */}
        <div className="stream-setup">
          <div className="stream-setup__head">
            <span className="stream-icon">📹</span>
            <div>
              <h3>Stream Settings</h3>
              <p>Configure your broadcast quality</p>
            </div>
          </div>
          <div className="stream-setup__meta upload-wrap">
            <select value={streamQuality} onChange={(e) => setStreamQuality(e.target.value)}>
              <option>720p Standard Definition</option>
              <option>1080p High Definition</option>
            </select>
          </div>
        </div>

        <div className="go-live-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="go-live-submit btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Scheduling...' : 'Create Auction'}
          </button>
        </div>
      </form>
    </div>
  );
}