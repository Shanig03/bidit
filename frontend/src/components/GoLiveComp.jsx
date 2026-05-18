import PageContainer from './PageContainer';
import StatusBadge from './StatusBadge';
import Button from './Button';
import FormInput from './FormInput';
import SelectField from './SelectField';
import TextareaField from './TextareaField';
import UploadBox from './UploadBox';
import { useGoLive, durationOptions } from '../hooks/useGoLive';
import './GoLiveComp.css';

export default function GoLiveComp() {
  const {
    title, setTitle,
    description, setDescription,
    category, setCategory,
    startingPrice, setStartingPrice,
    duration, setDuration,
    streamQuality, setStreamQuality,
    serverError,
    successMessage,
    isSubmitting,
    handleStartAuction,
    handleCancel
  } = useGoLive();

  return (
    <PageContainer className="go-live-page">
      <header className="go-live-header">
        <StatusBadge tone="neutral">Start Live Streaming</StatusBadge>
        <h1>
          Go <span>Live</span>
        </h1>
        <p>Set up your live video auction and start showcasing your product to bidders worldwide</p>
      </header>

      <form className="go-live-card card" onSubmit={handleStartAuction}>
        <div className="stream-setup">
          <div className="stream-setup__head">
            <span className="stream-icon">📹</span>
            <div>
              <h3>Live Stream Setup</h3>
              <p>Your camera and microphone will be activated when you start the auction</p>
            </div>
          </div>
          
          <div className="stream-setup__meta">
            <SelectField
              label="Stream Quality Profile"
              options={['720p Standard Definition', '1080p High Definition']}
              value={streamQuality}
              onChange={(event) => setStreamQuality(event.target.value)}
            />
            <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', color: '#5a6388' }}>
              Estimated Reach: <strong>Global Audience via Agora Edge</strong>
            </p>
          </div>
        </div>

        <FormInput
          label="Product Title"
          placeholder="Enter a descriptive title for your item"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />

        <TextareaField
          label="Description"
          placeholder="Provide detailed information about your item including condition, features, and any defects."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <div className="go-live-grid-2">
          <SelectField
            label="Category"
            options={['Photography', 'Fashion', 'Music', 'Collectibles', 'Electronics', 'General']}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />

          <FormInput
            label="Starting Price ($)"
            placeholder="0.00"
            type="number"
            min="1"
            value={startingPrice}
            onChange={(event) => setStartingPrice(event.target.value)}
            required
          />
        </div>

        <SelectField
          label="Live Stream Duration"
          options={durationOptions.map((item) => item.label)}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
        />

        <div className="upload-wrap">
          <p className="upload-title">Product Preview Images</p>
          <small>Upload thumbnail images for your auction listing</small>
          <UploadBox />
        </div>

        {serverError && <p className="go-live-error" style={{ color: 'red', fontWeight: 'bold' }}>{serverError}</p>}
        {successMessage && <p className="go-live-success" style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}

        <div className="go-live-actions">
          <Button
            type="submit"
            variant="urgent"
            className="go-live-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Auction...' : 'Start Live Auction'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}