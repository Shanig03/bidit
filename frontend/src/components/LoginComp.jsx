import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from './PageContainer';
import Button from './Button';
import './LoginComp.css';

export default function LoginComp({ onSubmit, onGoogleLogin, error, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    onSubmit(email, password);
  };

  return (
    <PageContainer className="login-page">
      <section className="login-shell">
        <p className="login-brand">BidIt</p>
        <h1>Welcome Back!</h1>
        <p className="login-subtitle">Log in to join live auctions and start bidding</p>

        <form className="login-card card" onSubmit={handleSubmit}>
          {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

          <label htmlFor="email">Email Address</label>
          <div className="login-input-wrap">
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
          <div className="login-input-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className="login-eye"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              
            </button>
          </div>

          <div className="login-row">
            <label className="login-check">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <Button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </Button>

          <div className="login-separator">
            <span>OR</span>
          </div>

          <button
            className="login-google"
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
          >
            <span>G</span>
            Continue with Google
          </button>

          <p className="login-signup">
            Don&apos;t have an account? <Link to="/signup">Sign up for free</Link>
          </p>
        </form>

        <p className="login-terms">
          By logging in, you agree to our <Link to="/">Terms of Service</Link> and <Link to="/">Privacy Policy</Link>
        </p>
      </section>
    </PageContainer>
  );
}