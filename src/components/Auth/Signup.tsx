import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Receipt, Mail, Lock, Hash, UserPlus, ShieldCheck, FileText, BarChart3, TrendingUp } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Left block */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 max-w-xl mx-auto">
        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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

              {/* GST Number */}
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

              {/* Terms */}
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" required className="form-checkbox text-emerald-500" />
                I agree to the{' '}
                <Link to="/terms" className="text-emerald-500 underline hover:text-emerald-400">Terms of Service</Link>{' '}
                and{' '}
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

        <div className="mt-6 text-center text-xs text-gray-500">
          Join <span className="text-emerald-400 font-medium">500+</span> successful content creators
          <div className="flex justify-center gap-4 mt-2 text-emerald-400 text-sm">
            <span>🔒 Bank-level Security</span>
            <span>🧾 GST Compliant</span>
            <span>⚡ Instant Setup</span>
          </div>
        </div>
      </div>

      {/* Right block */}
      <div className="hidden md:flex w-full md:w-1/2 flex-col justify-center p-12 bg-gray-800 text-white">
        <h2 className="text-3xl font-bold mb-4">Maximize Your <span className="text-emerald-500">Financial Growth</span></h2>
        <p className="text-gray-400 mb-8">
          Transform your content creation into a profitable business with professional invoicing and financial tracking.
        </p>

        {/* Analytics */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-400">₹50L+</p>
            <p className="text-sm text-gray-300">Revenue Processed</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-400">1000+</p>
            <p className="text-sm text-gray-300">Invoices Generated</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-lg font-bold text-emerald-400">₹25K</p>
            <p className="text-sm text-gray-300">Avg Monthly Earnings</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-lg font-bold text-orange-400">95%</p>
            <p className="text-sm text-gray-300">Payment Success Rate</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-emerald-500 w-5 h-5 mt-1" />
            <div>
              <p className="font-medium text-white">Smart GST Calculation</p>
              <p className="text-gray-400">Automatic 9% or 18% GST based on location</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BarChart3 className="text-emerald-500 w-5 h-5 mt-1" />
            <div>
              <p className="font-medium text-white">Revenue Analytics</p>
              <p className="text-gray-400">Track earnings and payment trends</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="text-emerald-500 w-5 h-5 mt-1" />
            <div>
              <p className="font-medium text-white">Professional Invoices</p>
              <p className="text-gray-400">Brand-perfect invoice templates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="text-emerald-500 w-5 h-5 mt-1" />
            <div>
              <p className="font-medium text-white">Financial Insights</p>
              <p className="text-gray-400">Detailed revenue breakdowns</p>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="bg-gradient-to-r from-emerald-700 to-green-600 mt-10 p-4 rounded-lg text-center text-sm text-green-100">
          <strong className="text-white">💡 Financial Growth Promise</strong><br />
          Our creators see an average of <span className="text-white font-medium">40% increase</span> in payment efficiency and <span className="text-white font-medium">25% faster</span> invoice processing.
        </div>
      </div>
    </div>
  );
};

export default Signup;
