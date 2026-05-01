import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const schema = z.object({ email: z.string().email('Invalid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.requestPasswordReset(data.email);
      setSent(true);
    } catch {
      setError('Failed to send reset email.');
    }
  };

  return (
    <div className="lbd-login-page">
      <div className="card lbd-login-card shadow-lg">
        <div className="card-body p-4 p-md-5">
          <Link
            to="/login"
            className="d-inline-flex align-items-center gap-1 mb-4 text-muted"
            style={{ fontSize: 13, textDecoration: 'none' }}
          >
            <i className="fas fa-arrow-left" /> Back to login
          </Link>

          <h4 className="fw-bold mb-1" style={{ color: '#333' }}>Reset Password</h4>
          <p className="text-muted small mb-4">
            Enter your email address and we&apos;ll send you a reset link.
          </p>

          {sent ? (
            <Alert
              variant="success"
              message="If that email exists in our system, you'll receive a password reset link shortly."
            />
          ) : (
            <>
              {error && <Alert variant="error" message={error} className="mb-3" />}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <Input
                    id="email"
                    label="Email Address"
                    type="email"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
                <Button type="submit" loading={isSubmitting} className="w-100">
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
