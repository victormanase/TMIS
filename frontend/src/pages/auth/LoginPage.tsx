import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await authApi.login(data.email, data.password);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    }
  };

  return (
    <div className="lbd-login-page">
      <div className="card lbd-login-card shadow-lg">
        <div className="card-body p-4 p-md-5">
          {/* Brand */}
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-3"
              style={{ width: 56, height: 56, background: 'var(--lbd-primary)' }}
            >
              <i className="fas fa-building text-white" style={{ fontSize: 24 }} />
            </div>
            <h2 className="fw-bold mb-1" style={{ color: '#333' }}>TMIS</h2>
            <p className="text-muted small mb-0">Rental Units Management System</p>
          </div>

          {error && <Alert variant="error" message={error} className="mb-3" />}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="admin@tmis.local"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="mb-3">
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <div className="text-end mb-3">
              <Link to="/forgot-password" style={{ color: 'var(--lbd-primary)', fontSize: 13 }}>
                Forgot password?
              </Link>
            </div>
            <Button type="submit" loading={isSubmitting} className="w-100">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
