import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../../services/auth/login';
import { useAuth } from '../../context/AuthContext';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import FormField from '../../components/common/FormField';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

function LoginPage() {
  const navigate = useNavigate();
  const { execute, loading, error } = useAsyncAction(loginWithEmail);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    const userCred = await execute(values.email, values.password);

    // Fetch the user's role from Firestore and redirect accordingly
    try {
      const uid = userCred?.uid || userCred?.user?.uid;
      if (uid) {
        const snap = await getDoc(doc(db, 'users', uid));
        const role = snap.data()?.role;
        if (role === 'admin') return navigate('/app/admin');
        if (role === 'driver') return navigate('/app/driver');
        if (role === 'parent') return navigate('/app/parent');
      }
    } catch {
      // fallback
    }
    navigate('/app/parent');
  };

  return (
    <div className="auth-wrap animate-in">
      <div className="panel auth-panel">
        <div className="auth-hero">
          <span className="hero-eyebrow">Welcome Back</span>
          <h1 className="auth-logo">Hop-In 🚌</h1>
          <p className="auth-tagline">Smart student transport platform</p>
          <ul className="auth-feature-list">
            <li>Role-based secure access</li>
            <li>Real-time location tracking</li>
            <li>Instant QR attendance alerts</li>
          </ul>
        </div>

        <form className="auth-body" onSubmit={handleSubmit(onSubmit)}>
          <h2 style={{ marginBottom: '1.5rem' }}>Sign In</h2>
          <FormField label="Email" error={errors.email?.message}>
            <input {...register('email', { required: 'Email is required' })} type="email" placeholder="name@example.com" />
          </FormField>

          <FormField label="Password" error={errors.password?.message}>
            <input {...register('password', { required: 'Password is required' })} type="password" placeholder="••••••••" />
          </FormField>

          {error && <p className="error-text">{error}</p>}

          <button className="btn" disabled={loading} type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="auth-links">
            <Link to="/register-parent">Parent Registration</Link>
            <Link to="/register-driver">Driver Registration</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
