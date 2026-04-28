import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.requestPasswordReset(data.email);
      setSent(true);
    } catch {
      setError('Failed to send reset email.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft size={14} /> Back to login
        </Link>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h2>
        <p className="text-slate-500 text-sm mb-6">Enter your email address and we'll send you a reset link.</p>

        {sent ? (
          <Alert variant="success" message="If that email exists in our system, you'll receive a password reset link shortly." />
        ) : (
          <>
            {error && <Alert variant="error" message={error} className="mb-4" />}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input id="email" label="Email Address" type="email" error={errors.email?.message} {...register('email')} />
              <Button type="submit" loading={isSubmitting} className="w-full">Send Reset Link</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
