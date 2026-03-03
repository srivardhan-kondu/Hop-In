import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { registerDriver } from '../../services/auth/register';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import FormField from '../../components/common/FormField';

const schema = yup.object({
  name: yup.string().required(),
  phone: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  aadhaarNumber: yup.string().min(12).required(),
  aadhaarDocUrl: yup
    .string()
    .trim()
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .url()
    .notRequired(),
  yearsOfExperience: yup.number().min(0).max(60).required(),
  schoolId: yup.string().required(),
  pickupTime: yup.string().required(),
  dropTime: yup.string().required(),
  capacity: yup.number().min(1).required(),
  pricePerMonth: yup.number().min(1).required(),
});

function RegisterDriverPage() {
  const navigate = useNavigate();
  const { execute, loading, error } = useAsyncAction(registerDriver);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    await execute(values);
    navigate('/app/driver');
  };

  return (
    <div className="auth-wrap animate-in">
      <div className="panel auth-panel">
        <div className="auth-hero">
          <span className="hero-eyebrow">For Drivers</span>
          <h1 className="auth-logo">Hop-In 🚌</h1>
          <p className="auth-tagline">Partner with us to provide safe school commutes.</p>
          <ul className="auth-feature-list" style={{ marginTop: '1rem' }}>
            <li>Manage daily attendance easily</li>
            <li>Build trust with Aadhaar verification</li>
            <li>Get direct bookings from parents</li>
          </ul>
        </div>

        <form className="auth-body" onSubmit={handleSubmit(onSubmit)}>
          <h2 style={{ marginBottom: '1.5rem' }}>Driver Registration</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Full Name" error={errors.name?.message}><input {...register('name')} placeholder="Rajesh Kumar" /></FormField>
            <FormField label="Phone Number" error={errors.phone?.message}><input {...register('phone')} placeholder="+91 9876543210" /></FormField>
            <FormField label="Email Address" error={errors.email?.message}><input type="email" {...register('email')} placeholder="rajesh@example.com" /></FormField>
            <FormField label="Password" error={errors.password?.message}><input type="password" {...register('password')} placeholder="••••••••" /></FormField>

            <div style={{ gridColumn: 'span 2', margin: '0.5rem 0' }}>
              <hr style={{ border: 'none', borderTop: '1px solid var(--c-border)' }} />
            </div>

            <FormField label="Aadhaar Number" error={errors.aadhaarNumber?.message}><input {...register('aadhaarNumber')} placeholder="1234 5678 9012" /></FormField>
            <FormField label="Aadhaar Doc URL" error={errors.aadhaarDocUrl?.message}><input {...register('aadhaarDocUrl')} placeholder="https://..." /></FormField>
            <FormField label="Years Experience" error={errors.yearsOfExperience?.message}><input type="number" {...register('yearsOfExperience')} placeholder="5" /></FormField>
            <FormField label="School ID" error={errors.schoolId?.message}><input {...register('schoolId')} placeholder="SCH123" /></FormField>

            <FormField label="Pickup Time" error={errors.pickupTime?.message}><input type="time" {...register('pickupTime')} /></FormField>
            <FormField label="Drop Time" error={errors.dropTime?.message}><input type="time" {...register('dropTime')} /></FormField>

            <FormField label="Van Capacity" error={errors.capacity?.message}><input type="number" {...register('capacity')} placeholder="15" /></FormField>
            <FormField label="Monthly Price (₹)" error={errors.pricePerMonth?.message}><input type="number" {...register('pricePerMonth')} placeholder="2500" /></FormField>
          </div>

          <div className="badge-pending" style={{ marginTop: '1rem', width: 'fit-content' }}>
            ⏳ Accounts require admin verification before accepting bookings
          </div>

          {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}
          <button className="btn" disabled={loading} style={{ width: '100%', marginTop: '1.5rem' }}>
            {loading ? 'Submitting Application...' : 'Create Driver Account'}
          </button>

          <div className="auth-links">
            <Link to="/login">Already have an account? Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterDriverPage;
