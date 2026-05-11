import "./LoginPage.css";

function LoginPage() {
  return (
    <section className="login-page">
      <div className="login-card">
        <h1>Welcome back to Bidit</h1>
        <p>Sign in to bid instantly, follow streamers, and manage your auctions.</p>

        <form className="login-form">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="you@startup.com" />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" />

          <button type="submit">Sign In</button>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
