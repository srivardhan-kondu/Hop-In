import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAdmin } from '../../services/auth/register';

const ADMIN_SECRET = 'HOPIN-ADMIN-2024';

function RegisterAdminPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', secret: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.secret !== ADMIN_SECRET) {
            setError('Invalid admin secret code. Please contact the system owner.');
            return;
        }
        if (!form.name || !form.email || !form.password) {
            setError('All fields are required.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await registerAdmin({ name: form.name, email: form.email, password: form.password });
            navigate('/app/admin');
        } catch (err) {
            setError(err?.message ?? 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap animate-in">
            <div className="panel auth-panel">
                <div className="auth-hero">
                    <span className="hero-eyebrow">For Admins</span>
                    <h1 className="auth-logo">Hop-In 🚌</h1>
                    <p className="auth-tagline">Platform administration and oversight center.</p>
                    <ul className="auth-feature-list" style={{ marginTop: '1rem' }}>
                        <li>Verify drivers with Aadhaar checks</li>
                        <li>Monitor system-wide stats</li>
                        <li>Respond to emergency alerts</li>
                    </ul>
                    <div className="badge-pending" style={{ marginTop: '1.5rem', width: 'fit-content' }}>
                        🔐 Requires secret admin code
                    </div>
                </div>

                <form className="auth-body" onSubmit={onSubmit}>
                    <h2 style={{ marginBottom: '1.5rem' }}>Admin Registration</h2>

                    <label className="form-field">
                        <span>Full Name</span>
                        <input value={form.name} onChange={set('name')} placeholder="Admin Name" required />
                    </label>

                    <label className="form-field">
                        <span>Email Address</span>
                        <input type="email" value={form.email} onChange={set('email')} placeholder="admin@hopin.com" required />
                    </label>

                    <label className="form-field">
                        <span>Password</span>
                        <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required />
                    </label>

                    <label className="form-field">
                        <span>Admin Secret Code</span>
                        <input
                            type="password"
                            value={form.secret}
                            onChange={set('secret')}
                            placeholder="Enter secret code"
                            required
                        />
                    </label>
                    <p className="muted" style={{ fontSize: '0.78rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                        The secret code is: <strong style={{ color: 'var(--c-primary)' }}>HOPIN-ADMIN-2024</strong>
                    </p>

                    {error && <p className="error-text">{error}</p>}

                    <button className="btn" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                        {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
                    </button>

                    <div className="auth-links" style={{ marginTop: '1rem' }}>
                        <Link to="/login">Already have an account? Sign in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterAdminPage;
