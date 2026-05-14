import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import SelectField from '../components/ui/SelectField';
import TextareaField from '../components/ui/TextareaField';
import UploadBox from '../components/ui/UploadBox';
import './GoLivePage.css';

function GoLivePage() {
  return (
    <>
      <Navbar />
      <PageContainer className="go-live-page">
        <header className="go-live-header">
          <StatusBadge tone="neutral">Start Live Streaming</StatusBadge>
          <h1>
            Go <span>Live</span>
          </h1>
          <p>Set up your live video auction and start showcasing your product to bidders worldwide</p>
        </header>

        <section className="go-live-card card">
          <div className="stream-setup">
            <div className="stream-setup__head">
              <span className="stream-icon">📹</span>
              <div>
                <h3>Live Stream Setup</h3>
                <p>Your camera and microphone will be activated when you start the auction</p>
              </div>
            </div>
            <div className="stream-setup__meta">
              <p>Stream Quality: <strong>1080p HD</strong></p>
              <p>Estimated Reach: <strong>Global Audience</strong></p>
            </div>
          </div>

          <FormInput label="Product Title" placeholder="Enter a descriptive title for your item" />
          <TextareaField label="Description" placeholder="Provide detailed information about your item including condition, features, and any defects." />

          <div className="go-live-grid-2">
            <SelectField label="Category" options={['Photography', 'Fashion', 'Music', 'Collectibles']} />
            <FormInput label="Starting Price ($)" placeholder="0.00" />
          </div>

          <SelectField label="Live Stream Duration" options={['24 hours', '12 hours', '6 hours', '3 hours']} />

          <div className="upload-wrap">
            <p className="upload-title">Product Preview Images</p>
            <small>Upload thumbnail images for your auction listing</small>
            <UploadBox />
          </div>

          <div className="go-live-actions">
            <Button variant="urgent" className="go-live-submit">Start Live Auction</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </section>
      </PageContainer>
    </>
  );
}

export default GoLivePage;
