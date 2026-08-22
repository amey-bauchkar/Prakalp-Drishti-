import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  KeyRound,
  ArrowLeft 
} from 'lucide-react';
import { Card, InputField, Button } from '../../src/components/ui';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt call to Amey's backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.token) {
          setError('Authentication failed. No token received.');
          return;
        }
        const userRole = data.role || (data.user?.role) || 'admin';
        const userData = {
          email: email.trim(),
          role: userRole,
          name: data.user?.name || '',
          department: data.user?.department || '',
        };
        login(data.token, userData);

        // Role-based destination
        const destination = location.state?.from?.pathname || (userRole === 'worker' ? '/worker' : '/admin');
        navigate(destination, { replace: true });
        return;
      }

      const errData = await response.json().catch(() => ({}));
      setError(errData.message || 'Invalid email or password.');
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-14 bg-gov-surface">
      <div className="w-full max-w-md">
        
        {/* Top return link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gov-muted hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </Link>
        </div>

        {/* Login Card */}
        <Card variant="white" padding="lg" className="border-gov-border shadow-elevated">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gov-navy text-gov-accent rounded-lg flex items-center justify-center mx-auto mb-4 shadow-soft">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-gov-navy tracking-tight">
              BMC Authority Portal Access
            </h1>
            <p className="text-xs text-gov-muted mt-1 font-medium">
              Brihanmumbai Municipal Corporation (BMC) • Municipal Administration
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div 
              role="alert"
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-rose-700 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <InputField
              id="admin-email"
              type="email"
              label="Official BMC Email"
              placeholder="admin@bmc.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            {/* Password Field */}
            <InputField
              id="admin-password"
              type="password"
              label="Security Credentials"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              icon={ArrowRight}
              iconPosition="right"
              className="mt-2"
            >
              Authenticate & Enter Dashboard
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-gov-border text-center">
            <p className="text-[11px] font-bold text-gov-muted uppercase tracking-wider mb-2">
              Quick Demo Logins (Click to autofill):
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@bmc.gov.in');
                  setPassword('Admin@123');
                }}
                className="flex-1 py-1.5 px-2 bg-gov-surface hover:bg-gov-accent/20 border border-gov-border rounded-lg text-xs font-bold text-gov-navy transition-all"
              >
                🏛️ BMC Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('ravi.kumar@bmc.gov.in');
                  setPassword('Worker@123');
                }}
                className="flex-1 py-1.5 px-2 bg-gov-surface hover:bg-gov-accent/20 border border-gov-border rounded-lg text-xs font-bold text-gov-navy transition-all"
              >
                👷‍♂️ Field Worker
              </button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AdminLogin;
