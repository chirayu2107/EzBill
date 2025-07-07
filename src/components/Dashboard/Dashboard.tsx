import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import SummaryCards from './SummaryCards';
import InvoiceTable from './InvoiceTable';
import InvoicePreview from '../Invoice/InvoicePreview';
import { Invoice } from '../../types';
import { Plus, TrendingUp, FileText, DollarSign } from 'lucide-react';
import Button from '../UI/Button';

const Dashboard: React.FC = () => {
  const { invoices } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    if (statusFilter === 'all') return true;
    return invoice.status === statusFilter;
  });

  const recentInvoices = filteredInvoices.slice(0, 5);

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    navigate(`/edit-invoice/${invoice.id}`);
  };

  const closePreview = () => {
    setSelectedInvoice(null);
  };

  const getEmptyMessage = () => {
    if (invoices.length === 0) {
      return {
        title: "No invoices found",
        subtitle: "Create your first invoice to get started"
      };
    } else if (recentInvoices.length === 0) {
      return {
        title: "No invoices found",
        subtitle: `No ${statusFilter === 'all' ? '' : statusFilter} invoices available`
      };
    }
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8 select-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-2xl p-8 text-white"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <motion.h1 
              className="text-4xl font-bold mb-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Welcome back, {user?.fullName?.split(' ')[0]}! 👋
            </motion.h1>
            <motion.p 
              className="text-emerald-100 text-lg"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Here's your business overview for today
            </motion.p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <Button
              onClick={() => navigate('/create-invoice')}
              icon={Plus}
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 hover:text-emerald-600 shadow-lg font-semibold"
            >
              Create Invoice
            </Button>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-4 right-20 w-16 h-16 bg-white/10 rounded-full"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-4 left-20 w-8 h-8 bg-white/20 rounded-full"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants}>
        <SummaryCards />
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={itemVariants}
      >
        <motion.div
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/create-invoice')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create Invoice</h3>
              <p className="text-blue-100">Generate new invoice</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/invoices')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">View All Invoices</h3>
              <p className="text-purple-100">Manage your invoices</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Business Profile</h3>
              <p className="text-orange-100">Update your details</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div className="space-y-6" variants={itemVariants}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Recent Invoices</h2>
            <p className="text-gray-400">Your latest 5 invoices</p>
          </div>
          <div className="flex gap-2">
            {filters.map(filter => (
              <motion.button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  statusFilter === filter.value
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>

        {getEmptyMessage() ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-16 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">{getEmptyMessage()?.title}</h3>
              <p className="text-gray-400 mb-6">{getEmptyMessage()?.subtitle}</p>
              {invoices.length === 0 && (
                <Button
                  onClick={() => navigate('/create-invoice')}
                  icon={Plus}
                  size="lg"
                >
                  Create Your First Invoice
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <InvoiceTable 
              invoices={recentInvoices} 
              onViewInvoice={handleViewInvoice}
              onEditInvoice={handleEditInvoice}
            />

            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={() => navigate('/invoices')}
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600"
              >
                View All Invoices ({invoices.length})
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>

      {selectedInvoice && (
        <InvoicePreview invoice={selectedInvoice} onClose={closePreview} />
      )}
    </motion.div>
  );
};

export default Dashboard;