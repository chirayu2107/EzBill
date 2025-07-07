import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import InvoiceTable from './InvoiceTable';
import InvoicePreview from '../Invoice/InvoicePreview';
import { Invoice } from '../../types';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

const InvoicesPage: React.FC = () => {
  const { invoices } = useApp();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filters = [
    { value: 'all', label: 'All Invoices', count: invoices.length },
    { value: 'paid', label: 'Paid', count: invoices.filter(i => i.status === 'paid').length },
    { value: 'unpaid', label: 'Unpaid', count: invoices.filter(i => i.status === 'unpaid').length },
    { value: 'overdue', label: 'Overdue', count: invoices.filter(i => i.status === 'overdue').length },
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
    } else if (filteredInvoices.length === 0) {
      return {
        title: "No invoices found",
        subtitle: `No ${statusFilter === 'all' ? '' : statusFilter} invoices match your criteria`
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
      {/* Header */}
      <motion.div 
        className="flex justify-between items-start"
        variants={itemVariants}
      >
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <FileText className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">All Invoices</h1>
              <p className="text-gray-400 text-lg">Manage and track all your invoices</p>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Button
            onClick={() => navigate('/create-invoice')}
            icon={Plus}
            size="lg"
            className="shadow-lg"
          >
            Create New Invoice
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        variants={itemVariants}
      >
        {filters.map((filter, index) => (
          <motion.div
            key={filter.value}
            className={`cursor-pointer transition-all duration-300 ${
              statusFilter === filter.value
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10'
                : 'hover:bg-gray-750'
            }`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter(filter.value as any)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${statusFilter === filter.value ? 'bg-emerald-500/5 border-emerald-500/20' : ''}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  filter.value === 'paid' ? 'text-green-500' :
                  filter.value === 'unpaid' ? 'text-yellow-500' :
                  filter.value === 'overdue' ? 'text-red-500' :
                  'text-emerald-500'
                }`}>
                  {filter.count}
                </div>
                <div className="text-gray-300 font-medium">{filter.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices by customer name or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
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
                    {filter.label} ({filter.count})
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Results Summary */}
      <motion.div 
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div className="text-gray-400">
          Showing {filteredInvoices.length} of {invoices.length} invoices
          {searchTerm && (
            <span className="ml-2">
              for "<span className="text-white">{searchTerm}</span>"
            </span>
          )}
        </div>
        
        {searchTerm && (
          <motion.button
            onClick={() => setSearchTerm('')}
            className="text-emerald-500 hover:text-emerald-400 text-sm"
            whileHover={{ scale: 1.05 }}
          >
            Clear search
          </motion.button>
        )}
      </motion.div>

      {/* Invoices Table or Empty State */}
      <motion.div variants={itemVariants}>
        {getEmptyMessage() ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center py-16">
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
            </Card>
          </motion.div>
        ) : (
          <InvoiceTable 
            invoices={filteredInvoices} 
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
          />
        )}
      </motion.div>

      {selectedInvoice && (
        <InvoicePreview invoice={selectedInvoice} onClose={closePreview} />
      )}
    </motion.div>
  );
};

export default InvoicesPage;