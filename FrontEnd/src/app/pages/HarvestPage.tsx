import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Scale, Calendar, TrendingUp, Loader2, QrCode, X, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

interface HarvestRecord {
  id: number;
  worker: { id: number; user?: { name: string } };
  plot: { blockId: string };
  harvestDate: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  calculatedPay?: number;
}

export function HarvestPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const plantationId = user?.publicMetadata?.plantationId as string | undefined;

  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [plots, setPlots] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedWorker, setSelectedWorker] = useState<string>('ALL');
  const [selectedPlot, setSelectedPlot] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HarvestRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    plotId: '',
    harvestDate: new Date().toISOString().split('T')[0],
    grossWeight: '',
    tareWeight: '1'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScan = useRef(false);
  const grossWeightRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [harvestData, workerData, plotData] = await Promise.all([
        api.getHarvests(selectedMonth, plantationId, token || undefined).catch(err => {
          console.error('Failed to fetch harvests:', err);
          return [];
        }),
        api.getWorkers(plantationId, token || undefined).catch(err => {
          console.error('Failed to fetch workers:', err);
          return [];
        }),
        api.getPlots(plantationId, token || undefined).catch(err => {
          console.error('Failed to fetch plots:', err);
          return [];
        })
      ]);
      setHarvests(harvestData);
      setWorkers(workerData);
      setPlots(plotData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const startScanner = async () => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      toast.error("Camera access requires a secure (HTTPS) connection or localhost.");
      return;
    }

    setShowScanner(true);
    setCameraError(null);
    isProcessingScan.current = false;

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        await scanner.start({ facingMode: "environment" }, config, onScanSuccess, () => { });
      } catch (err: any) {
        setCameraError(err.message || "Could not access camera.");
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;

    const worker = workers.find(w => w.qrCode === decodedText);

    if (worker) {
      toast.success(`Worker identified: ${worker.user?.name || 'Worker'}`);
      setFormData(prev => ({
        ...prev,
        workerId: worker.id.toString(),
        plotId: worker.assignedBlock || prev.plotId
      }));
      await stopScanner();
      setShowModal(true);
      setTimeout(() => {
        grossWeightRef.current?.focus();
      }, 500);
    } else {
      toast.error("Worker not found or invalid QR code.");
      isProcessingScan.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId || !formData.plotId || !formData.grossWeight || !formData.tareWeight) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        workerId: parseInt(formData.workerId),
        grossWeight: parseFloat(formData.grossWeight),
        tareWeight: parseFloat(formData.tareWeight),
        plantationId: plantationId ? parseInt(plantationId) : null
      };

      const token = await getToken();
      if (editingRecord) {
        await api.updateHarvest(editingRecord.id, payload, token || undefined);
      } else {
        await api.recordHarvest(payload, token || undefined);
      }

      setShowModal(false);
      setEditingRecord(null);
      setFormData({
        workerId: '',
        plotId: '',
        harvestDate: new Date().toISOString().split('T')[0],
        grossWeight: '',
        tareWeight: '1'
      });
      fetchData();
      toast.success('Harvest record saved!');
    } catch (error) {
      console.error('Failed to save harvest:', error);
      toast.error('Failed to save harvest record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: HarvestRecord) => {
    setEditingRecord(record);
    setFormData({
      workerId: record.worker.id.toString(),
      plotId: record.plot.blockId,
      harvestDate: record.harvestDate,
      grossWeight: record.grossWeight.toString(),
      tareWeight: record.tareWeight.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this harvest record?')) return;
    try {
      const token = await getToken();
      await api.deleteHarvest(id, token || undefined);
      fetchData();
      toast.success('Record deleted');
    } catch (error) {
      console.error('Failed to delete harvest:', error);
      toast.error(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredHarvests = useMemo(() => {
    let result = harvests.filter((h) => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch =
        (h.worker.user?.name || '').toLowerCase().includes(searchStr) ||
        h.plot.blockId.toLowerCase().includes(searchStr);

      const matchesWorker = selectedWorker === 'ALL' || h.worker.id.toString() === selectedWorker;
      const matchesPlot = selectedPlot === 'ALL' || h.plot.blockId === selectedPlot;

      return matchesSearch && matchesWorker && matchesPlot;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
      if (sortBy === 'date-asc') return new Date(a.harvestDate).getTime() - new Date(b.harvestDate).getTime();
      if (sortBy === 'weight-desc') return b.netWeight - a.netWeight;
      if (sortBy === 'weight-asc') return a.netWeight - b.netWeight;
      if (sortBy === 'payout-desc') return (b.calculatedPay || 0) - (a.calculatedPay || 0);
      return 0;
    });
  }, [harvests, searchTerm, selectedWorker, selectedPlot, sortBy]);

  const todayTotal = useMemo(() => filteredHarvests
    .filter(h => h.harvestDate === new Date().toISOString().split('T')[0])
    .reduce((sum, h) => sum + h.netWeight, 0), [filteredHarvests]);

  const weeklyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      yield: filteredHarvests
        .filter(h => h.harvestDate === date)
        .reduce((sum, h) => sum + h.netWeight, 0)
    }));
  }, [filteredHarvests]);

  const weeklyTotal = useMemo(() =>
    weeklyData.reduce((sum, d) => sum + d.yield, 0),
    [weeklyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 dark:text-green-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Harvest & Yield Tracker</h1>
          <p className="text-muted-foreground mt-1">Monitor and record worker leaf yield</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-orange-100 dark:shadow-none"
          >
            <QrCode className="w-5 h-5" />
            Scan & Record
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                workerId: '',
                plotId: '',
                harvestDate: new Date().toISOString().split('T')[0],
                grossWeight: '',
                tareWeight: '1'
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-green-100 dark:shadow-none"
          >
            <Plus className="w-5 h-5" />
            Record Harvest
          </button>
        </div>
      </div>

      {/* Enhanced Filter Section */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by worker name or block ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all bg-card text-foreground font-bold"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
              >
                <option value="ALL">All Workers</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.user?.name || 'Unnamed Worker'}</option>
                ))}
              </select>
            </div>

            <select
              value={selectedPlot}
              onChange={(e) => setSelectedPlot(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
            >
              <option value="ALL">All Blocks</option>
              {plots.map(p => (
                <option key={p.id} value={p.blockId}>{p.blockId}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 border-l pl-3 ml-2 border-border">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="weight-desc">Weight (High-Low)</option>
                <option value="weight-asc">Weight (Low-High)</option>
                <option value="payout-desc">Payout (Highest)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-bold uppercase tracking-widest text-left opacity-70">Today's Harvest</p>
          <p className="text-2xl font-black text-foreground text-left">{todayTotal.toFixed(1)} kg</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-bold uppercase tracking-widest text-left opacity-70">Weekly Total</p>
          <p className="text-2xl font-black text-foreground text-left">{weeklyTotal.toFixed(1)} kg</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-bold uppercase tracking-widest text-left opacity-70">Total Records</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 text-left">{harvests.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-bold uppercase tracking-widest text-left opacity-70">Avg Net Weight</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 text-left">
            {harvests.length > 0 ? (harvests.reduce((s, h) => s + h.netWeight, 0) / harvests.length).toFixed(1) : 0} kg
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-black text-foreground mb-6 uppercase tracking-widest text-left">Weekly Harvest Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.1} />
              <XAxis 
                dataKey="day" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: '#16a34a' }}
              />
              <Line type="monotone" dataKey="yield" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-black text-foreground uppercase tracking-widest text-left">Recent Harvest Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/20">
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Date</th>
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Worker</th>
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Block</th>
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Weight (kg)</th>
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Details</th>
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Action</th>
                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Payout</th>
              </tr>
            </thead>
            <tbody>
              {filteredHarvests.map((harvest) => (
                  <tr key={harvest.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 text-sm text-foreground font-bold">{harvest.harvestDate}</td>
                    <td className="py-3 px-4 text-sm font-black text-foreground uppercase tracking-tight">{harvest.worker.user?.name || 'Unnamed Worker'}</td>
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{harvest.plot.blockId}</td>
                    <td className="py-3 px-4 text-sm font-black text-foreground">{harvest.netWeight.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">G: {harvest.grossWeight} | T: {harvest.tareWeight}</span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(harvest)} className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs uppercase">Edit</button>
                        <button onClick={() => handleDelete(harvest.id)} className="text-red-600 dark:text-red-400 hover:underline font-bold text-xs uppercase">Delete</button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-black text-green-600 dark:text-green-400">
                      {harvest.calculatedPay ? `LKR ${harvest.calculatedPay.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              {harvests.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-50">No harvest records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-green-50 dark:bg-green-950/30">
              <h2 className="text-xl font-black text-green-900 dark:text-green-400 uppercase tracking-tighter">{editingRecord ? 'Edit Record' : 'Record Harvest'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Worker *</label>
                <select
                  required
                  value={formData.workerId}
                  onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                >
                  <option value="">Select Worker</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.user?.name || 'Unnamed Worker'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Plot / Block *</label>
                <select
                  required
                  value={formData.plotId}
                  onChange={(e) => setFormData({ ...formData, plotId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                >
                  <option value="">Select Block</option>
                  {plots.map(p => <option key={p.id} value={p.blockId}>{p.blockId}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Date *</label>
                <input
                  required
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Gross (kg) *</label>
                  <input
                    ref={grossWeightRef}
                    required
                    type="number"
                    step="0.01"
                    value={formData.grossWeight}
                    onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Tare (kg) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.tareWeight}
                    onChange={(e) => setFormData({ ...formData, tareWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-xs hover:bg-muted transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all shadow-md shadow-green-100 dark:shadow-none">
                  {isSubmitting ? 'Saving...' : (editingRecord ? 'Update' : 'Save Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-[60] backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-orange-50 dark:bg-orange-950/30">
              <h2 className="text-xl font-black text-orange-900 dark:text-orange-400 flex items-center gap-2 uppercase tracking-tighter"><QrCode className="w-6 h-6" />Scan Worker QR</h2>
              <button onClick={stopScanner} className="text-muted-foreground hover:text-foreground p-1 transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <div className="p-6 text-center">
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-orange-200 dark:border-orange-950 bg-muted/30 aspect-square mb-4"></div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Scan worker QR to quickly record their harvest</p>
              {cameraError && <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-lg border border-red-200 dark:border-red-900/50">{cameraError}</div>}
            </div>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-center">
              <button onClick={stopScanner} className="px-8 py-2 bg-card border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-xs hover:bg-muted transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
