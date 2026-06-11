'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Mail, Lock, User, ArrowRight, Zap, Shield, Users } from 'lucide-react';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.username, form.password, form.password2);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errors = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = errors ? Object.values(errors).flat().join(' ') : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', icon: Mail },
    { name: 'username', label: 'Username', type: 'text', placeholder: 'johndoe', icon: User },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', icon: Lock },
    { name: 'password2', label: 'Confirm password', type: 'password', placeholder: '••••••••', icon: Lock },
  ] as const;

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">CollabSpace</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Join your team<br />today.
            </h2>
            <p className="mt-4 text-green-100 text-lg leading-relaxed">
              Create your account and start collaborating with your team in minutes.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Free to get started' },
              { icon: Shield, text: 'Your data stays private' },
              { icon: Users, text: 'Invite your whole team' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-green-100">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-green-200 text-sm">© 2025 CollabSpace. Built for teams.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">CollabSpace</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1 mb-8 text-sm">Join CollabSpace and start collaborating</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                <div className="relative">
                  <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    required
                    placeholder={field.placeholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus-green text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-sm flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-green-600 font-semibold hover:text-green-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
