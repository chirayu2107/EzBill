import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Mail, Lock, Hash, UserPlus } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    gstNumber: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const success = await signup({
        email: formData.email,
        password: formData.password,
        gstNumber: formData.gstNumber,
      });
      
      if (!success) {
        setError('Email already exists or signup failed');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">EzBill</h1>
          </div>
          <p className="text-gray-400">Create your business account</p>
          <p className="text-sm text-gray-500 mt-2">Complete your profile after signup</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GST Number (optional)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter GST number (optional)"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">You can add this later in your profile</p>
              </div>
            </div>

            <Button
              type="submit"
              icon={UserPlus}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-500 hover:text-emerald-400">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <h4 className="text-emerald-400 font-medium mb-2">What's Next?</h4>
              <ul className="text-sm text-emerald-300 space-y-1">
                <li>• Complete your business profile</li>
                <li>• Add banking details</li>
                <li>• Set up invoice preferences</li>
                <li>• Start creating professional invoices</li>
              </ul>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Signup;