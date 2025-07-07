import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, Plus, Receipt, User, LogOut } from 'lucide-react';
import Button from '../UI/Button';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/create-invoice', icon: Plus, label: 'Create Invoice' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EzBill</h1>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-6 border-t border-gray-700">
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Signed in as</p>
          <p className="text-white font-medium">{user?.fullName}</p>
        </div>
        <Button
          onClick={logout}
          variant="secondary"
          icon={LogOut}
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;