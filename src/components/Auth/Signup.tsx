import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Hash, UserPlus } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    gstNumber: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, confirmPassword, gstNumber } = formData;

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const success = await signup({ email, password, gstNumber });
      if (success) {
        navigate('/');
      } else {
        setError('Email already exists or signup failed');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 max-w-xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Create a strong password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GST Number (optional)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter GST number"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" required className="form-checkbox text-emerald-500" />
                I agree to the{' '}
                <Link to="/terms" className="text-emerald-500 underline hover:text-emerald-400">Terms of Service</Link>{' '}and{' '}
                <Link to="/privacy" className="text-emerald-500 underline hover:text-emerald-400">Privacy Policy</Link>
              </label>
            </div>

            <Button type="submit" icon={UserPlus} disabled={loading} className="w-full" size="lg">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-500 hover:text-emerald-400">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>

      <div className="hidden md:flex w-full md:w-1/2 flex-col justify-center p-12 bg-gray-800 text-white">
        <h2 className="text-3xl font-bold mb-4">Maximize Your <span className="text-emerald-500">Financial Growth</span></h2>
        <p className="text-gray-400 mb-8">
          Transform your content creation into a profitable business with professional invoicing and financial tracking.
        </p>
      </div>
    </div>
  );
};

export default Signup;