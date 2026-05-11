function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(1rem, 3vw, 2rem)',
        background:
          'radial-gradient(circle at 0% 0%, #8b5cf61f 0, transparent 35%), radial-gradient(circle at 100% 100%, #06b6d41f 0, transparent 40%), linear-gradient(145deg, #09090f 0%, #121827 45%, #0f172a 100%)',
      }}
    >
      <section
        style={{
          width: 'min(980px, 100%)',
          borderRadius: '28px',
          overflow: 'hidden',
          border: '1px solid #ffffff24',
          background: 'linear-gradient(140deg, #ffffff17, #ffffff08)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 24px 70px #02061780',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
        }}
      >
        <aside
          style={{
            padding: 'clamp(1.5rem, 5vw, 4rem)',
            color: '#e2e8f0',
            borderRight: '1px solid #ffffff1f',
            background:
              'linear-gradient(160deg, rgba(30,41,59,0.78), rgba(15,23,42,0.55))',
            textAlign: 'left',
          }}
        >
          <p style={{ letterSpacing: '0.28em', fontSize: '0.76rem', color: '#67e8f9' }}>
            BIDIT LIVE
          </p>
          <h1
            style={{
              margin: '1rem 0',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#f8fafc',
            }}
          >
            Host, hype, and sell in real-time.
          </h1>
          <p style={{ marginBottom: '2rem', color: '#cbd5e1', maxWidth: '30ch' }}>
            Your storefront for fast-paced live auctions. Sign in to go live, drop products, and
            convert excitement into bids.
          </p>

          <div style={{ display: 'grid', gap: '0.8rem' }}>
            {['Instant stream controls', 'Auction analytics at a glance', 'Secure payouts and buyer trust'].map((item) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '1.1rem',
                    height: '1.1rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(120deg, #22d3ee, #a855f7)',
                    boxShadow: '0 0 0 2px #0f172a inset',
                  }}
                />
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div
          style={{
            padding: 'clamp(1.5rem, 5vw, 3rem)',
            display: 'grid',
            alignContent: 'center',
            gap: '1rem',
            textAlign: 'left',
            color: '#f8fafc',
          }}
        >
          <h2 style={{ fontSize: '1.75rem', margin: 0, color: '#ffffff' }}>Welcome back</h2>
          <p style={{ margin: 0, color: '#cbd5e1' }}>Sign in and start your next bidding show.</p>

          <form style={{ display: 'grid', gap: '0.85rem', marginTop: '0.8rem' }}>
            <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.92rem' }}>
              Email
              <input
                type="email"
                placeholder="you@brand.com"
                style={{
                  border: '1px solid #ffffff3d',
                  background: '#0b1222a8',
                  color: '#f8fafc',
                  borderRadius: '12px',
                  padding: '0.85rem 0.95rem',
                  outline: 'none',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.92rem' }}>
              Password
              <input
                type="password"
                placeholder="••••••••"
                style={{
                  border: '1px solid #ffffff3d',
                  background: '#0b1222a8',
                  color: '#f8fafc',
                  borderRadius: '12px',
                  padding: '0.85rem 0.95rem',
                  outline: 'none',
                }}
              />
            </label>

            <button
              type="button"
              style={{
                marginTop: '0.35rem',
                border: 0,
                borderRadius: '12px',
                padding: '0.9rem 1rem',
                fontWeight: 700,
                background: 'linear-gradient(120deg, #06b6d4 0%, #8b5cf6 60%, #ec4899 100%)',
                color: '#fff',
                boxShadow: '0 14px 30px #0ea5e94d',
                cursor: 'pointer',
              }}
            >
              Enter the Bid Room
            </button>
          </form>

          <p style={{ marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            New to Bidit? <span style={{ color: '#67e8f9', fontWeight: 600 }}>Create an account</span>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
