import { Link } from 'react-router-dom';

function LandingPage() {
    return (
        <div className="landing animate-in">
            <header className="topbar">
                <div className="topbar-right" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <p className="brand">Hop-In 🚌</p>
                    <div className="action-row">
                        <Link to="/register-admin" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>Admin</Link>
                        <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
                        <Link to="/register-parent" className="btn btn-sm">Get Started</Link>
                    </div>
                </div>
            </header>

            <main className="landing-hero">
                <span className="hero-eyebrow">The Future of School Commutes</span>
                <h1 className="hero-headline">
                    Smart, Safe, and Verified <span>Student Transport</span>
                </h1>
                <p className="hero-sub">
                    Connect with trusted, Aadhaar-verified drivers. Track your child's journey in real-time, get instant geo-fence alerts, and ensure safe boarding with QR attendance.
                </p>
                <div className="hero-ctas">
                    <Link to="/app/search" className="btn btn-lg">Find a Van Near You</Link>
                    <Link to="/register-driver" className="btn btn-outline btn-lg">Drive with Us</Link>
                </div>
            </main>

            <section className="features-section">
                <h2 className="features-heading">Why parents and schools trust Hop-In</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon">📍</span>
                        <h3>Real-Time Tracking</h3>
                        <p>Watch the van's live location on the map and receive automatic alerts when it's 1km or 500m away from your home.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🛡️</span>
                        <h3>Verified Drivers</h3>
                        <p>Every driver undergoes strict background checks with mandatory Aadhaar verification by our admin team.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">📱</span>
                        <h3>Smart Attendance</h3>
                        <p>Instant push notifications the moment your child boards the van via a secure, unique QR code scan.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} Hop-In. Redefining Student Mobility with Smart Technology.</p>
            </footer>
        </div>
    );
}

export default LandingPage;
