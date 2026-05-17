import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import SelectField from '../components/ui/SelectField';
import TextareaField from '../components/ui/TextareaField';
import UploadBox from '../components/ui/UploadBox';
import { createAuction } from '../api/auctionsApi';
import './GoLivePage.css';

const durationOptions = [
  { label: '24 hours', hours: 24 },
  { label: '12 hours', hours: 12 },
  { label: '6 hours', hours: 6 },
  { label: '3 hours', hours: 3 },
];

function calculateEndsAt(durationLabel) {
  const selectedDuration = durationOptions.find((duration) => duration.label === durationLabel);
  const hoursToAdd = selectedDuration ? selectedDuration.hours : 24;

  const endDate = new Date();
  endDate.setHours(endDate.getHours() + hoursToAdd);

  return endDate.toISOString();
}

function GoLivePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Photography');
  const [startingPrice, setStartingPrice] = useState('');
  const [duration, setDuration] = useState('24 hours');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleStartAuction(event) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Product title is required.');
      return;
    }

    if (!startingPrice || Number(startingPrice) <= 0) {
      setErrorMessage('Starting price must be greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await createAuction({
        sellerId: 'firebase-user-123',
        title: title.trim(),
        description: description.trim(),
        category,
        startingPrice: Number(startingPrice),
        endsAt: calculateEndsAt(duration),
        imageUrl: '',
      });

      setSuccessMessage('Auction created successfully.');

      navigate(`/auction/${result.auction.auctionId}`);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create auction.');
    } finally {
      setIsSubmitting(false);
    }
  }

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
              <p>
                Stream Quality: <strong>1080p HD</strong>
              </p>
              <p>
                Estimated Reach: <strong>Global Audience</strong>
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

          {errorMessage && <p className="go-live-error">{errorMessage}</p>}
          {successMessage && <p className="go-live-success">{successMessage}</p>}

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
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </PageContainer>
    </>
  );
}

export default GoLivePage;