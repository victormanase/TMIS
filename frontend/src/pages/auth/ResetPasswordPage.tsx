import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const schema = z
  .object({
    password: z.string().min(8, 'Minimum 8 characters'),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = searchParams.get('token') ?? '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await authApi.confirmPasswordReset(token, data.password);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to reset password.');
    }
  };

  return (
    <div className="lbd-login-page">
      <div className="card lbd-login-card shadow-lg">
        <div className="card-body p-4 p-md-5">
          <h4 className="fw-bold mb-1" style={{ color: '#333' }}>Set New Password</h4>
          <p className="text-muted small mb-4">Choose a strong password for your account.</p>

          {error && <Alert variant="error" message={error} className="mb-3" />}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <Input
                id="password"
                label="New Password"
                type="password"
                placeholder="Minimum 8 characters"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>
            <div className="mb-3">
              <Input
                id="confirm"
                label="Confirm Password"
                type="password"
                placeholder="Repeat new password"
                error={errors.confirm?.message}
                {...register('confirm')}
              />
            </div>
            <Button type="submit" loading={isSubmitting} className="w-100">
              Set Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
