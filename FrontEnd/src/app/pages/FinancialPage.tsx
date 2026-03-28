import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Download, Loader2, Info, Activity, Plus, ChevronRight, Edit2, Trash2, AlertCircle, Package, CheckCircle, Search, Filter, ArrowUpDown, Calendar } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface PayrollRecord {
  id: number;
  worker: {
    id: number;
    user?: {
      name: string;
      bankName?: string;
      branchName?: string;
      accountNumber?: string;
      accountHolderName?: string;
    };
  };
  basicWage: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: string;
}

interface IncomeRecord {
  id: number;
  date: {
    month: number;
    year: number;
  };
  factory: FactoryRecord;
  totalWeight: number;
  pricePerKg: number;
  transportDeduction: number;
  otherDeductions: number;
  grossAmount: number;
  netAmount: number;
  description: string;
  receivedDate: string;
}

interface FactoryRecord {
  id: number;
  name: string;
  registerNo: string;
  pricePerKg: number;
  contactNumber?: string;
  lorrySupervisorName?: string;
  lorrySupervisorContact?: string;
}

interface DeliveryRecord {
  id: number;
  factory: FactoryRecord;
  weight: number;
  deliveryDate: string;
  priceAtDelivery: number;
  totalValue: number;
  status: string;
}

export function FinancialPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const plantationId = user?.publicMetadata?.plantationId as string | undefined;

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [factories, setFactories] = useState<FactoryRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [inventoryExpenses, setInventoryExpenses] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showFactoryModal, setShowFactoryModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showEditPayrollModal, setShowEditPayrollModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayrollForPayment, setSelectedPayrollForPayment] = useState<PayrollRecord | null>(null);
  const [payrollPreview, setPayrollPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    month: new Date().toISOString().slice(0, 7) // YYYY-MM
  });
  const [incomeFormData, setIncomeFormData] = useState({
    factoryId: '',
    totalWeight: '',
    pricePerKg: '',
    transportDeduction: '0',
    otherDeductions: '0',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: ''
  });
  const [factoryFormData, setFactoryFormData] = useState({
    name: '',
    registerNo: '',
    pricePerKg: ''
  });
  const [deliveryFormData, setDeliveryFormData] = useState({
    factoryId: '',
    weight: '',
    deliveryDate: new Date().toISOString().split('T')[0]
  });

  // Search & Filter States
  const [incomeSearchTerm, setIncomeSearchTerm] = useState('');
  const [incomeSortBy, setIncomeSortBy] = useState<string>('date-desc');

  const [payrollSearchTerm, setPayrollSearchTerm] = useState('');
  const [payrollFilterStatus, setPayrollFilterStatus] = useState<string>('ALL');
  const [payrollSortBy, setPayrollSortBy] = useState<string>('name-asc');

  const fetchData = async () => {
    setLoading(true);

    const token = await getToken();
    // Fetch each independently to prevent one failure from blocking all data
    const fetchers = [
      { key: 'payroll', fn: () => api.getPayrolls(selectedMonth, plantationId, token || undefined), setter: setPayrolls },
      { key: 'workers', fn: () => api.getWorkers(plantationId, token || undefined), setter: setWorkers },
      { key: 'incomes', fn: () => api.getIncomes(selectedMonth, plantationId, token || undefined), setter: setIncomes },
      { key: 'factories', fn: () => api.getFactories(plantationId, token || undefined), setter: setFactories },
      { key: 'deliveries', fn: () => api.getDeliveries(selectedMonth, plantationId, token || undefined), setter: setDeliveries },
      { key: 'inventoryExpenses', fn: () => api.getInventoryExpenses(selectedMonth, plantationId, token || undefined), setter: setInventoryExpenses }
    ];

    await Promise.all(fetchers.map(async (f) => {
      try {
        const data = await f.fn();
        if (data && typeof data === 'object' && 'error' in data) {
          console.error(`Backend error for ${f.key}:`, data.message);
          f.setter([]);
        } else {
          f.setter(data || []);
        }
      } catch (error) {
        console.error(`Failed to fetch ${f.key}:`, error);
      }
    }));

    setLoading(false);
  };

  useEffect(() => {
    const fetchPreview = async () => {
      if (showModal && formData.workerId && formData.month) {
        setIsPreviewLoading(true);
        try {
          const token = await getToken();
          const preview = await api.getPayrollPreview(formData.workerId, formData.month, token || undefined);
          setPayrollPreview(preview);
        } catch (error) {
          console.error('Failed to fetch payroll preview:', error);
          setPayrollPreview(null);
        } finally {
          setIsPreviewLoading(false);
        }
      } else {
        setPayrollPreview(null);
      }
    };

    fetchPreview();
  }, [showModal, formData.workerId, formData.month]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId || !formData.month) {
      alert('Please select a worker and month');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.generatePayroll({
        worker: { id: parseInt(formData.workerId) },
        month: `${formData.month}-01`
      }, token || undefined);
      setShowModal(false);
      fetchData();
      alert('Payroll generated successfully!');
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      alert('Failed to generate payroll record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeFormData.factoryId || !incomeFormData.totalWeight || !incomeFormData.pricePerKg) {
      alert('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        factory: { id: parseInt(incomeFormData.factoryId) },
        totalWeight: parseFloat(incomeFormData.totalWeight),
        pricePerKg: parseFloat(incomeFormData.pricePerKg),
        transportDeduction: parseFloat(incomeFormData.transportDeduction) || 0,
        otherDeductions: parseFloat(incomeFormData.otherDeductions) || 0,
        date: {
          month: incomeFormData.month,
          year: incomeFormData.year
        },
        description: incomeFormData.description
      };

      const token = await getToken();
      if (editingIncome) {
        await api.updateIncome(editingIncome.id, data, token || undefined);
      } else {
        await api.createIncome(data, plantationId || '', token || undefined);
      }

      setShowIncomeModal(false);
      setEditingIncome(null);
      setIncomeFormData({
        factoryId: '',
        totalWeight: '',
        pricePerKg: '',
        transportDeduction: '0',
        otherDeductions: '0',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        description: ''
      });
      fetchData();
      alert('Monthly paysheet recorded successfully!');
    } catch (error) {
      console.error('Failed to record income:', error);
      alert('Failed to record monthly paysheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIncome = (income: IncomeRecord) => {
    setEditingIncome(income);
    setIncomeFormData({
      factoryId: income.factory.id.toString(),
      totalWeight: income.totalWeight.toString(),
      pricePerKg: income.pricePerKg.toString(),
      transportDeduction: income.transportDeduction.toString(),
      otherDeductions: income.otherDeductions.toString(),
      month: income.date.month,
      year: income.date.year,
      description: income.description || ''
    });
    setShowIncomeModal(true);
  };

  const handleDeleteIncome = async (id: number) => {
    if (!confirm('Are you sure you want to delete this factory paysheet?')) return;
    try {
      const token = await getToken();
      await api.deleteIncome(id, token || undefined);
      fetchData();
    } catch (error) {
      console.error('Failed to delete income:', error);
      alert(`Failed to delete income record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryFormData.name) {
      alert('Factory name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.createFactory({
        ...factoryFormData,
        pricePerKg: parseFloat(factoryFormData.pricePerKg) || 0,
        plantationId: plantationId
      }, token || undefined);
      setShowFactoryModal(false);
      setFactoryFormData({ name: '', registerNo: '', pricePerKg: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to add factory:', error);
      alert('Failed to add factory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryFormData.factoryId || !deliveryFormData.weight) {
      alert('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.recordDelivery({
        factory: { id: parseInt(deliveryFormData.factoryId) },
        weight: parseFloat(deliveryFormData.weight),
        deliveryDate: deliveryFormData.deliveryDate,
        plantationId: plantationId
      }, token || undefined);
      setShowDeliveryModal(false);
      setDeliveryFormData({ factoryId: '', weight: '', deliveryDate: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Failed to record delivery:', error);
      alert('Failed to record delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.updatePayroll(editingPayroll.id, {
        bonuses: editingPayroll.bonuses,
        deductions: editingPayroll.deductions
      }, token || undefined);
      setShowEditPayrollModal(false);
      setEditingPayroll(null);
      fetchData();
      alert('Payroll updated successfully!');
    } catch (error) {
      console.error('Failed to update payroll:', error);
      alert(`Failed to update payroll: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayroll = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;

    try {
      const token = await getToken();
      await api.deletePayroll(id, token || undefined);
      fetchData();
      alert('Payroll record deleted.');
    } catch (error) {
      console.error('Failed to delete payroll:', error);
      alert(`Failed to delete payroll record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePay = async (payroll: PayrollRecord) => {
    if (!confirm(`Mark payroll for ${payroll.worker.user?.name || 'this worker'} as PAID?`)) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.updatePayrollStatus(payroll.id, 'PAID', token || undefined);
      setShowPaymentModal(false);
      setSelectedPayrollForPayment(null);
      fetchData();
      alert('Payroll marked as PAID successfully!');
    } catch (error) {
      console.error('Failed to update payroll status:', error);
      alert('Failed to mark payroll as PAID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncomes = useMemo(() => {
    let result = [...incomes];

    if (incomeSearchTerm) {
      const term = incomeSearchTerm.toLowerCase();
      result = result.filter(i =>
        i.factory?.name?.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      if (incomeSortBy === 'date-desc') return (b.date.year * 12 + b.date.month) - (a.date.year * 12 + a.date.month);
      if (incomeSortBy === 'amount-desc') return (b.netAmount || 0) - (a.netAmount || 0);
      if (incomeSortBy === 'amount-asc') return (a.netAmount || 0) - (b.netAmount || 0);
      return 0;
    });

    return result;
  }, [incomes, incomeSearchTerm, incomeSortBy]);

  const filteredPayrolls = useMemo(() => {
    let result = [...payrolls];

    if (payrollSearchTerm) {
      const term = payrollSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.worker?.user?.name?.toLowerCase().includes(term)
      );
    }

    if (payrollFilterStatus !== 'ALL') {
      result = result.filter(p => p.status === payrollFilterStatus);
    }

    result.sort((a, b) => {
      if (payrollSortBy === 'name-asc') return (a.worker?.user?.name || '').localeCompare(b.worker?.user?.name || '');
      if (payrollSortBy === 'amount-desc') return (b.netPay || 0) - (a.netPay || 0);
      if (payrollSortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });

    return result;
  }, [payrolls, payrollSearchTerm, payrollFilterStatus, payrollSortBy]);

  const totalPayroll = useMemo(() =>
    payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0),
    [payrolls]);

  const totalRevenue = useMemo(() =>
    incomes.reduce((sum, i) => sum + (i.netAmount || 0), 0),
    [incomes]);

  const totalExpenses = useMemo(() => {
    const labor = totalPayroll;
    const inventory = typeof inventoryExpenses === 'number' ? inventoryExpenses : 0;
    return labor + inventory;
  }, [totalPayroll, inventoryExpenses]);

  const netProfit = useMemo(() => {
    return totalRevenue - totalExpenses;
  }, [totalRevenue, totalExpenses]);
  
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const token = await getToken();
      const blob = await api.downloadFinancialReport(plantationId!, selectedMonth, token || undefined);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Financial_Report_${selectedMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export financial report.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Financial & Payroll</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Period:</p>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-0.5 border border-border rounded text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-md shadow-blue-100 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            Generate Payroll
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] disabled:opacity-50 transition-all shadow-sm"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Total Revenue</p>
          </div>
          <p className="text-2xl font-black text-foreground uppercase tracking-tight">
            LKR {totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">Total from factory labels</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Labor Expenses</p>
          </div>
          <p className="text-2xl font-black text-foreground uppercase tracking-tight">
            LKR {totalPayroll.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">Sum of all net payrolls</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Input Expenses</p>
          </div>
          <p className="text-2xl font-black text-foreground uppercase tracking-tight">
            LKR {inventoryExpenses.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">Fertilizer, chemicals & stock</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm group hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Net Profit</p>
          </div>
          <p className={`text-2xl font-black uppercase tracking-tight ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            LKR {netProfit.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">Revenue minus all expenses</p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Factory Paysheets</h3>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 uppercase tracking-widest transition-all"
            >
              + Record Paysheet
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search factory..."
                value={incomeSearchTerm}
                onChange={(e) => setIncomeSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-muted/50 text-foreground text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <select
                value={incomeSortBy}
                onChange={(e) => setIncomeSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-black text-foreground uppercase tracking-tight outline-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredIncomes.map((income) => (
              <div key={income.id} className="p-4 bg-muted/30 rounded-lg border border-border hover:border-blue-500/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-black text-foreground uppercase tracking-tight">{income.factory?.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
                      {new Date(0, (income.date?.month || 1) - 1).toLocaleString('default', { month: 'long' })} {income.date?.year}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-black text-green-600 dark:text-green-400 text-lg uppercase tracking-tight">LKR {income.netAmount?.toLocaleString()}</p>
                    <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditIncome(income)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIncome(income.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[9px] text-muted-foreground font-black bg-muted px-2 py-0.5 rounded-full mt-2 uppercase tracking-tight">ID: #{income.id}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-[10px] font-black uppercase tracking-widest border-t border-border pt-3 mt-2 opacity-80">
                  <div className="text-muted-foreground">Gross Weight:</div>
                  <div className="text-right text-foreground">{income.totalWeight} kg</div>
                  <div className="text-muted-foreground">Price per Kg:</div>
                  <div className="text-right text-foreground">LKR {income.pricePerKg}</div>
                  <div className="text-red-400">Transport:</div>
                  <div className="text-right text-red-500">-(LKR {income.transportDeduction})</div>
                  <div className="text-red-400">Other Cutouts:</div>
                  <div className="text-right text-red-500">-(LKR {income.otherDeductions})</div>
                </div>
              </div>
            ))}
            {filteredIncomes.length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border opacity-50">
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">No monthly paysheets found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Revenue Allocation</h3>
          </div>

          <div className="flex-1 h-[350px] min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Labor', value: totalPayroll },
                    { name: 'Inputs', value: inventoryExpenses },
                    { name: 'Profit', value: Math.max(0, netProfit) }
                  ].filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#EF4444" />
                  <Cell fill="#F97316" />
                  <Cell fill="#22C55E" />
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => `LKR ${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-xl font-black fill-foreground tracking-tight">
                  LKR {totalRevenue.toLocaleString()}
                </text>
                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-black fill-muted-foreground uppercase tracking-widest opacity-70">
                  Total Revenue
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-[0.2em] font-black opacity-50">
            Internal Financial Allocation Overview
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Payroll Records</h3>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">
            Total payout: <span className="text-blue-600 dark:text-blue-400 font-black">LKR {totalPayroll.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by worker name..."
              value={payrollSearchTerm}
              onChange={(e) => setPayrollSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-muted/50 text-foreground text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={payrollFilterStatus}
                onChange={(e) => setPayrollFilterStatus(e.target.value)}
                className="bg-transparent text-[10px] font-black text-foreground uppercase tracking-tight outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <select
                value={payrollSortBy}
                onChange={(e) => setPayrollSortBy(e.target.value)}
                className="bg-transparent text-[10px] font-black text-foreground uppercase tracking-tight outline-none"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="amount-desc">Net Pay (High-Low)</option>
                <option value="status">Status</option>
              </select>
            </div>
            { (payrollSearchTerm || payrollFilterStatus !== 'ALL') && (
              <button 
                onClick={() => {
                  setPayrollSearchTerm('');
                  setPayrollFilterStatus('ALL');
                }}
                className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest hover:underline transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredPayrolls.map((payroll) => (
            <div key={payroll.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:border-blue-500/30 transition-all gap-4 group">
              <div className="flex flex-col">
                <span className="font-black text-foreground uppercase tracking-tight">{payroll.worker?.user?.name || 'Unknown Worker'}</span>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-70">ID: #{payroll.id}</span>
              </div>
              <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-widest">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground opacity-70 mb-1">Base Wage</span>
                  <span className="text-foreground">LKR {(payroll.basicWage || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-green-700 dark:text-green-400 opacity-70 mb-1">Bonus</span>
                  <span className="text-green-600 dark:text-green-400">LKR {(payroll.bonuses || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-red-700 dark:text-red-400 opacity-70 mb-1">Deductions</span>
                  <span className="text-red-600 dark:text-red-400">LKR {(payroll.deductions || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-blue-700 dark:text-blue-400 opacity-70 mb-1">Net Pay</span>
                  <span className="text-foreground font-black">LKR {(payroll.netPay || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-[0.1em] border border-border ${
                    payroll.status === 'PAID' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                    payroll.status === 'APPROVED' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                    'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {payroll.status}
                  </span>
                  <div className="flex items-center gap-1 border-l border-border pl-4 md:ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingPayroll(payroll);
                        setShowEditPayrollModal(true);
                      }}
                      className="p-1 px-2 text-blue-600 dark:text-blue-400 hover:underline text-[9px] font-black uppercase"
                      title="Edit Payroll"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDeletePayroll(payroll.id)}
                      className="p-1 px-2 text-red-600 dark:text-red-400 hover:underline text-[9px] font-black uppercase"
                      title="Delete Payroll"
                    >
                      DELETE
                    </button>
                    {payroll.status !== 'PAID' && (
                      <button
                        onClick={() => {
                          setSelectedPayrollForPayment(payroll);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase rounded transition-all shadow-sm ml-2"
                      >
                        PAY
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredPayrolls.length === 0 && (
            <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border opacity-50">
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">No payroll records found for the current filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
              <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter">Generate Payroll</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPayrollPreview(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Select Worker *</label>
                <select
                  required
                  value={formData.workerId}
                  onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                >
                  <option value="">Select Worker</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.user?.name || 'Unnamed Worker'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Month *</label>
                <input
                  required
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              {isPreviewLoading ? (
                <div className="py-4 flex flex-col items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Calculating earnings...</span>
                </div>
              ) : payrollPreview ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] mb-3">Earnings Summary</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Harvesting ({payrollPreview.harvestCount} records)</span>
                        </div>
                        <span className="text-sm font-black text-foreground uppercase tracking-tight">LKR {payrollPreview.harvestEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Tasks ({payrollPreview.taskCount} records)</span>
                        </div>
                        <span className="text-sm font-black text-foreground uppercase tracking-tight">LKR {payrollPreview.taskEarnings.toLocaleString()}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-blue-200/50 dark:border-blue-800/30 flex justify-between items-center">
                        <span className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Calculated Base Wage</span>
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight">LKR {payrollPreview.totalEarnings.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-black uppercase tracking-tight leading-relaxed">
                      Bonuses and deductions can be added after generating the initial payroll record.
                    </p>
                  </div>
                </div>
              ) : formData.workerId && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <p className="text-[10px] text-orange-700 dark:text-orange-300 font-black uppercase tracking-tight">No earnings found for this worker in the selected month.</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPayrollPreview(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (payrollPreview && payrollPreview.totalEarnings === 0)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground shadow-md shadow-blue-100 dark:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Payroll'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Factory Modal */}
      {showFactoryModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
              <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter">Register Factory</h2>
              <button
                onClick={() => setShowFactoryModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddFactory} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Factory Name *</label>
                <input
                  required
                  type="text"
                  value={factoryFormData.name}
                  onChange={(e) => setFactoryFormData({ ...factoryFormData, name: e.target.value })}
                  placeholder="e.g. Bogawantalawa Tea Factory"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold tracking-tight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Registration No</label>
                <input
                  type="text"
                  value={factoryFormData.registerNo}
                  onChange={(e) => setFactoryFormData({ ...factoryFormData, registerNo: e.target.value })}
                  placeholder="e.g. TF-2024-001"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold tracking-tight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Current Price per Kg (LKR)</label>
                <input
                  type="number"
                  value={factoryFormData.pricePerKg}
                  onChange={(e) => setFactoryFormData({ ...factoryFormData, pricePerKg: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowFactoryModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 dark:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-green-50 dark:bg-green-950/30">
              <h2 className="text-xl font-black text-green-900 dark:text-green-400 uppercase tracking-tighter">Record Tea Delivery</h2>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleRecordDelivery} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Factory *</label>
                <select
                  required
                  value={deliveryFormData.factoryId}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, factoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                >
                  <option value="">Select Factory</option>
                  {factories.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (LKR {f.pricePerKg}/kg)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Weight (kg) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={deliveryFormData.weight}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={deliveryFormData.deliveryDate}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900/30">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-black uppercase tracking-tight leading-relaxed">
                  The total value will be calculated automatically based on the factory's current price per kg.
                </p>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100 dark:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Factory Paysheet Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
              <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter">
                {editingIncome ? 'Edit Factory Paysheet' : 'Record Factory Paysheet'}
              </h2>
              <button
                onClick={() => {
                  setShowIncomeModal(false);
                  setEditingIncome(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Select Factory *</label>
                <select
                  required
                  value={incomeFormData.factoryId}
                  onChange={(e) => setIncomeFormData({ ...incomeFormData, factoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                >
                  <option value="">Select Factory</option>
                  {factories.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Gross Weight (kg) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={incomeFormData.totalWeight}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, totalWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Rate per Kg (LKR) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={incomeFormData.pricePerKg}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, pricePerKg: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mb-1">Transport Cut (LKR)</label>
                  <input
                    type="number"
                    value={incomeFormData.transportDeduction}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, transportDeduction: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mb-1">Other Cutouts (LKR)</label>
                  <input
                    type="number"
                    value={incomeFormData.otherDeductions}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, otherDeductions: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Month</label>
                  <select
                    value={incomeFormData.month}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Year</label>
                  <input
                    type="number"
                    value={incomeFormData.year}
                    onChange={(e) => setIncomeFormData({ ...incomeFormData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg flex gap-3 border border-blue-100 dark:border-blue-900/30">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-black uppercase tracking-tight leading-relaxed">
                  Gross amount and net amount will be calculated automatically based on the values above.
                </p>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 dark:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingIncome ? 'Save Changes' : 'Record Paysheet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Payroll Modal */}
      {showEditPayrollModal && editingPayroll && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-orange-50 dark:bg-orange-950/30">
              <h2 className="text-xl font-black text-orange-900 dark:text-orange-400 uppercase tracking-tighter">Edit Payroll: {editingPayroll.worker.user?.name || 'Unnamed Worker'}</h2>
              <button
                onClick={() => setShowEditPayrollModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleUpdatePayroll} className="p-6 space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl flex flex-col gap-1 border border-border">
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-70">Base Wage</span>
                <span className="text-lg font-black text-foreground uppercase tracking-tight">LKR {editingPayroll.basicWage?.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Bonuses (LKR)</label>
                <input
                  type="number"
                  value={editingPayroll.bonuses}
                  onChange={(e) => setEditingPayroll({ ...editingPayroll, bonuses: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Deductions (LKR)</label>
                <input
                  type="number"
                  value={editingPayroll.deductions}
                  onChange={(e) => setEditingPayroll({ ...editingPayroll, deductions: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <div className="flex justify-between items-center text-orange-800 dark:text-orange-300">
                  <span className="text-[10px] font-black uppercase tracking-widest">Calculated Net Pay</span>
                  <span className="text-xl font-black uppercase tracking-tight">
                    LKR {((editingPayroll.basicWage || 0) + (editingPayroll.bonuses || 0) - (editingPayroll.deductions || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditPayrollModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-100 dark:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayrollForPayment && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-green-50 dark:bg-green-950/30">
              <h2 className="text-xl font-black text-green-900 dark:text-green-400 uppercase tracking-tighter">Payment Details</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayrollForPayment(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 font-black text-xl uppercase">
                  {(selectedPayrollForPayment.worker.user?.name || 'W').charAt(0)}
                </div>
                <div>
                  <p className="font-black text-foreground text-lg uppercase tracking-tight">{selectedPayrollForPayment.worker.user?.name || 'Unnamed Worker'}</p>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">ID: #{selectedPayrollForPayment.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h3 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Bank Information
                  </h3>
                  <div className="text-[10px] text-blue-700 dark:text-blue-300 font-black uppercase tracking-widest space-y-1.5">
                    <div><span className="opacity-50 mr-2">Bank:</span> {selectedPayrollForPayment.worker.user?.bankName || 'N/A'}</div>
                    <div><span className="opacity-50 mr-2">Branch:</span> {selectedPayrollForPayment.worker.user?.branchName || 'N/A'}</div>
                    <div><span className="opacity-50 mr-2">A/C No:</span> <span className="text-blue-900 dark:text-blue-100 font-mono tracking-tight">{selectedPayrollForPayment.worker.user?.accountNumber || 'N/A'}</span></div>
                    <div><span className="opacity-50 mr-2">Holder:</span> {selectedPayrollForPayment.worker.user?.accountHolderName || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-70 mb-1">Total Payout</p>
                    <p className="text-lg font-black text-foreground uppercase tracking-tight">LKR {selectedPayrollForPayment.netPay.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border border-border">
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-70 mb-1">Status</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-border inline-block mt-1 ${
                      selectedPayrollForPayment.status === 'PAID' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 
                      'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'
                    }`}>
                      {selectedPayrollForPayment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayrollForPayment(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                >
                  Close
                </button>
                {selectedPayrollForPayment.status !== 'PAID' && (
                  <button
                    onClick={() => handlePay(selectedPayrollForPayment)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100 dark:shadow-none"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Mark as Paid
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  // END
}

