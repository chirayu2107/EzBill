import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, Receipt, CheckCircle, User, FileText } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Left Section: Features (was Right) */}
      <div className="hidden md:flex w-full md:w-1/2 flex-col justify-center px-12 py-12 bg-gray-800 text-white">
        <h2 className="text-3xl font-bold mb-4">Professional Invoicing Made Simple</h2>
        <p className="text-gray-400 mb-8">
          Join thousands of content creators who've streamlined their invoicing process with our GST-compliant solution.
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="text-emerald-500 mt-1" />
            <div>
              <h4 className="font-semibold">Auto GST Calculation</h4>
              <p className="text-gray-400 text-sm">Automatically calculates 9% or 18% GST based on state compliance</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <User className="text-emerald-500 mt-1" />
            <div>
              <h4 className="font-semibold">Brand Management</h4>
              <p className="text-gray-400 text-sm">Easily manage all your brand clients in one organized place</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <FileText className="text-emerald-500 mt-1" />
            <div>
              <h4 className="font-semibold">Instant PDF Generation</h4>
              <p className="text-gray-400 text-sm">Generate professional invoices in seconds with preview</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-8 text-center">
          <div>
            <h3 className="text-2xl font-bold text-emerald-500">1000+</h3>
            <p className="text-sm text-gray-400">Invoices Generated</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-emerald-500">500+</h3>
            <p className="text-sm text-gray-400">Happy Creators</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-emerald-500">₹50L+</h3>
            <p className="text-sm text-gray-400">Revenue Processed</p>
          </div>
        </div>
      </div>

      {/* Right Section: Login Form (was Left) */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">EzBill</h1>
            </div>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="form-checkbox text-emerald-500" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-emerald-500 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                icon={LogIn}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                size="lg"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-500 hover:text-emerald-400">
                  Sign up for free
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
