import { yupResolver } from '@hookform/resolvers/yup';
import { useFieldArray, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { registerParent } from '../../services/auth/register';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import FormField from '../../components/common/FormField';

const schema = yup.object({
  name: yup.string().required(),
  phone: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  children: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        age: yup.number().min(3).max(18).required(),
        schoolName: yup.string().required(),
        street: yup.string().required(),
        latitude: yup.number().required(),
        longitude: yup.number().required(),
      }),
    )
    .min(1),
});

function RegisterParentPage() {
  const navigate = useNavigate();
  const { execute, loading, error } = useAsyncAction(registerParent);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      children: [{ name: '', age: '', schoolName: '', street: '', latitude: '', longitude: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'children' });

  const onSubmit = async (values) => {
    await execute(values);
    navigate('/app/parent');
  };

  return (
    <div className="auth-wrap animate-in">
      <div className="panel auth-panel">
        <div className="auth-hero">
          <span className="hero-eyebrow">For Parents</span>
          <h1 className="auth-logo">Hop-In 🚌</h1>
          <p className="auth-tagline">Manage your children's school commutes with confidence.</p>
          <ul className="auth-feature-list" style={{ marginTop: '1rem' }}>
            <li>Track live vans on the map</li>
            <li>Get geo-fence approach alerts</li>
            <li>Monitor QR attendance securely</li>
          </ul>
        </div>

        <form className="auth-body" onSubmit={handleSubmit(onSubmit)}>
          <h2 style={{ marginBottom: '1.5rem' }}>Create Parent Account</h2>
          <FormField label="Full Name" error={errors.name?.message}><input {...register('name')} placeholder="John Doe" /></FormField>
          <FormField label="Phone" error={errors.phone?.message}><input {...register('phone')} placeholder="+91 9876543210" /></FormField>
          <FormField label="Email" error={errors.email?.message}><input type="email" {...register('email')} placeholder="john@example.com" /></FormField>
          <FormField label="Password" error={errors.password?.message}><input type="password" {...register('password')} placeholder="••••••••" /></FormField>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Children Profiles</h3>
          {fields.map((field, index) => (
            <div className="child-grid" key={field.id}>
              <div className="child-grid-header">
                <strong>Child {index + 1}</strong>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(index)}>Remove</button>
              </div>
              <input placeholder="Name" {...register(`children.${index}.name`)} />
              <input placeholder="Age" type="number" {...register(`children.${index}.age`)} />
              <input placeholder="School Name" {...register(`children.${index}.schoolName`)} style={{ gridColumn: 'span 2' }} />
              <input placeholder="Street Address" {...register(`children.${index}.street`)} style={{ gridColumn: 'span 2' }} />
              <input placeholder="Lat (e.g. 12.97)" type="number" step="any" {...register(`children.${index}.latitude`)} />
              <input placeholder="Lng (e.g. 77.59)" type="number" step="any" {...register(`children.${index}.longitude`)} />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ marginBottom: '1.5rem', width: 'auto' }}
            onClick={() => append({ name: '', age: '', schoolName: '', street: '', latitude: '', longitude: '' })}
          >
            + Add Another Child
          </button>

          {error && <p className="error-text">{error}</p>}
          <button className="btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="auth-links">
            <Link to="/login">Already have an account? Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterParentPage;
