import { Link } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import Button from '../components/ui/Button';
import './LoginPage.css';

function LoginPage() {
  return (
    <>
      <Navbar />
      <PageContainer className="login-page">
        <section className="login-shell">
          <p className="login-brand">📹 BidIt</p>
          <h1>Welcome Back!</h1>
          <p className="login-subtitle">Log in to join live auctions and start bidding</p>

          <div className="login-card card">
            <label htmlFor="email">Email Address</label>
            <div className="login-input-wrap">
              <span>✉️</span>
              <input id="email" type="email" placeholder="you@example.com" />
            </div>

            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span>🔒</span>
              <input id="password" type="password" placeholder="Enter your password" />
              <button className="login-eye" type="button" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>

            <div className="login-row">
              <label className="login-check">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/login">Forgot password?</Link>
            </div>

            <Button className="login-submit">Log In</Button>

            <div className="login-separator">
              <span>OR</span>
            </div>

            <button className="login-google" type="button">
              <span>G</span>
              Continue with Google
            </button>

            <p className="login-signup">
              Don&apos;t have an account? <Link to="/signup">Sign up for free</Link>
            </p>
          </div>

          <p className="login-terms">
            By logging in, you agree to our <Link to="/">Terms of Service</Link> and <Link to="/">Privacy Policy</Link>
          </p>
        </section>
      </PageContainer>
    </>
  );
}

export default LoginPage;
