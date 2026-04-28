import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = searchParams.get('token') ?? '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Set New Password</h2>
        {error && <Alert variant="error" message={error} className="mb-4" />}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input id="password" label="New Password" type="password" error={errors.password?.message} {...register('password')} />
          <Input id="confirm" label="Confirm Password" type="password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" loading={isSubmitting} className="w-full">Set Password</Button>
        </form>
      </div>
    </div>
  );
}
