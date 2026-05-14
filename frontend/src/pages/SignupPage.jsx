import { Link } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import PageContainer from '../components/ui/PageContainer';
import Button from '../components/ui/Button';
import './SignupPage.css';

function SignupPage() {
  return (
    <>
      <Navbar />
      <PageContainer className="signup-page">
        <section className="signup-shell">
          <p className="signup-brand">📹 BidIt</p>
          <h1>Join BidIt Today</h1>
          <p className="signup-subtitle">Create an account to start bidding on live video auctions</p>

          <div className="signup-card card">
            <label htmlFor="username">Username</label>
            <div className="signup-input-wrap">
              <span>👤</span>
              <input id="username" type="text" placeholder="Choose a username" />
            </div>

            <label htmlFor="email">Email Address</label>
            <div className="signup-input-wrap">
              <span>✉️</span>
              <input id="email" type="email" placeholder="you@example.com" />
            </div>

            <label htmlFor="password">Password</label>
            <div className="signup-input-wrap">
              <span>🔒</span>
              <input id="password" type="password" placeholder="Create a strong password" />
              <button className="signup-eye" type="button" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>

            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="signup-input-wrap">
              <span>🔒</span>
              <input id="confirmPassword" type="password" placeholder="Confirm your password" />
              <button className="signup-eye" type="button" aria-label="Toggle password visibility">
                👁️
              </button>
            </div>

            <label className="signup-check">
              <input type="checkbox" />
              <span>
                I agree to the <Link to="/">Terms of Service</Link> and <Link to="/">Privacy Policy</Link>
              </span>
            </label>

            <Button className="signup-submit">Create Account</Button>

            <p className="signup-login">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>

          <p className="signup-terms">
            By signing up, you agree to our <Link to="/">Terms of Service</Link> and <Link to="/">Privacy Policy</Link>.
          </p>
        </section>
      </PageContainer>
    </>
  );
}

export default SignupPage;
