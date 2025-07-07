import { GSTBreakdown } from '../types';

export const calculateGSTBreakdown = (amount: number, businessState: string, customerState: string): GSTBreakdown => {
  // IGST for Rajasthan customers, CGST+SGST for all other states
  const isRajasthan = customerState.toLowerCase() === 'rajasthan';
  const gstRate = 18;
  const totalGst = (amount * gstRate) / 100;
  
  if (isRajasthan) {
    return {
      isInterState: true,
      igst: totalGst,
      cgst: 0,
      sgst: 0,
      total: totalGst
    };
  } else {
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    return {
      isInterState: false,
      igst: 0,
      cgst,
      sgst,
      total: totalGst
    };
  }
};

export const calculateGST = (amount: number, rate: number = 18): number => {
  return (amount * rate) / 100;
};

export const calculateLineTotal = (quantity: number, rate: number): number => {
  return quantity * rate;
};

export const calculateSubtotal = (items: { quantity: number; rate: number }[]): number => {
  return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};