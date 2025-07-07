import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth } from '../config/firebase';
import { 
  addInvoice as addInvoiceToFirebase,
  updateInvoice as updateInvoiceInFirebase,
  deleteInvoice as deleteInvoiceFromFirebase,
  getUserInvoices
} from '../services/firebaseService';
import { Invoice, DashboardSummary } from '../types';

interface AppContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getDashboardSummary: () => DashboardSummary;
  getInvoiceById: (id: string) => Invoice | undefined;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load invoices when user is authenticated
  useEffect(() => {
    if (isAuthenticated && auth.currentUser) {
      loadInvoices();
    } else {
      setInvoices([]);
    }
  }, [isAuthenticated]);

  const loadInvoices = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const result = await getUserInvoices(auth.currentUser.uid);
      if (result.success) {
        setInvoices(result.invoices || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    if (!auth.currentUser) return;

    const invoiceNumber = `${user?.invoicePrefix || 'XUSE'}-${(5969 + invoices.length + 1).toString()}`;
    const newInvoice: Omit<Invoice, 'id'> = {
      ...invoiceData,
      invoiceNumber,
      createdAt: new Date(),
    };

    try {
      const result = await addInvoiceToFirebase(newInvoice, auth.currentUser.uid);
      if (result.success) {
        await loadInvoices(); // Reload invoices to get the latest data
      }
    } catch (error) {
      console.error('Error adding invoice:', error);
    }
  };

  const updateInvoice = async (id: string, invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    try {
      const result = await updateInvoiceInFirebase(id, invoiceData);
      if (result.success) {
        await loadInvoices(); // Reload invoices to get the latest data
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      const result = await updateInvoiceInFirebase(id, { status });
      if (result.success) {
        setInvoices(prev => 
          prev.map(invoice => 
            invoice.id === id ? { ...invoice, status } : invoice
          )
        );
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const result = await deleteInvoiceFromFirebase(id);
      if (result.success) {
        setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const getDashboardSummary = (): DashboardSummary => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const pendingAmount = invoices
      .filter(invoice => invoice.status === 'unpaid')
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const overdueAmount = invoices
      .filter(invoice => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoice.total, 0);

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
    };
  };

  const getInvoiceById = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        invoices,
        addInvoice,
        updateInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        getDashboardSummary,
        getInvoiceById,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};