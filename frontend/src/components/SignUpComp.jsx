import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from './PageContainer';
import Button from './Button';
import './SignUpComp.css';

export default function SignUpComp({ onSubmit, error, loading }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      return setLocalError('Passwords do not match');
    }

    // Pass user details up to the smart container
    // (Firebase auth handles email/pass natively, but you can save the username to Firestore later)
    onSubmit(email, password, username);
  };

  return (
    <PageContainer className="signup-page">
      <section className="signup-shell">
        <p className="signup-brand">BidIt</p>
        <h1>Join BidIt Today</h1>
        <p className="signup-subtitle">Create an account to start bidding on live video auctions</p>

        <form className="signup-card card" onSubmit={handleSubmit}>
          {(error || localError) && (
            <div className="error-message" style={{ color: 'red' }}>
              {error || localError}
            </div>
          )}

          <label htmlFor="username">Username</label>
          <div className="signup-input-wrap">
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <label htmlFor="email">Email Address</label>
          <div className="signup-input-wrap">
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="signup-input-wrap">
            <input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="signup-input-wrap">
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <label className="signup-check">
            <input type="checkbox" required />
            <span>
              I agree to the <Link to="/">Terms of Service</Link> and <Link to="/">Privacy Policy</Link>
            </span>
          </label>

          <Button type="submit" className="signup-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </Button>

          <p className="signup-login">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>

        <p className="signup-terms">
          By signing up, you agree to our <Link to="/">Terms of Service</Link> and <Link to="/">Privacy Policy</Link>.
        </p>
      </section>
    </PageContainer>
  );
}