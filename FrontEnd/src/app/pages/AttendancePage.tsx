import { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Loader2, Clock, Plus, QrCode, Search, Filter, ArrowUpDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import './AttendancePage.css';

interface AttendanceRecord {
  id: number;
  worker: { id: number; user?: { name: string } };
  checkIn: string;
  checkOut: string | null;
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'HALF_DAY';
  remarks?: string;
}

export function AttendancePage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const plantationId = user?.publicMetadata?.plantationId as string | undefined;

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    checkIn: new Date().toISOString().slice(0, 16),
    checkOut: '',
    status: 'PRESENT',
    remarks: ''
  });
  const [showScanner, setShowScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'time'; direction: 'asc' | 'desc' }>({ key: 'time', direction: 'desc' });
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScan = useRef(false);

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
        
        // Prefer back camera on mobile
        await scanner.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanFailure
        );
      } catch (err: any) {
        console.error("Camera start error:", err);
        setCameraError(err.message || "Could not access camera. Please ensure you have granted permission.");
        toast.error("Camera access failed. Please check permissions.");
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (error) {
        console.error("Failed to stop scanner: ", error);
      }
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingScan.current) return;
    isProcessingScan.current = true;
    
    console.log("QR Scanned (Processing):", decodedText);
    
    // Stop scanner first to avoid more scans from hardware
    await stopScanner();
    
    const token = await getToken();
    const promise = api.scanQrAttendance(decodedText, plantationId!, token || undefined);
    
    toast.promise(promise, {
      loading: 'Marking attendance...',
      success: (data) => {
        console.log("Attendance API Success:", data);
        fetchData();
        isProcessingScan.current = false;
        return `Attendance marked: ${data.worker.user?.name || 'Worker'} (${data.checkOut ? 'Check-out' : 'Check-in'})`;
      },
      error: (err) => {
        console.error("Attendance API Error:", err);
        isProcessingScan.current = false;
        return `Failed: ${err.message}`;
      }
    });
  };

  const onScanFailure = (error: any) => {
    // Suppress
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error(e));
      }
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // Fetch attendance for the selected date if needed, or filter locally if backend returns all
      // For now, assuming backend returns all or current plantation attendance
      const [attendanceData, workerData] = await Promise.all([
        api.getAttendance(plantationId, token || undefined),
        api.getWorkers(plantationId, token || undefined)
      ]);
      setAttendance(attendanceData);
      setWorkers(workerData);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId || !formData.checkIn || !formData.status) {
      alert('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        workerId: parseInt(formData.workerId),
        checkOut: formData.checkOut || null,
        plantationId: plantationId ? parseInt(plantationId) : null
      };

      const token = await getToken();
      if (editingRecord) {
        await api.updateAttendance(editingRecord.id, payload, token || undefined);
      } else {
        await api.recordAttendance(payload, token || undefined);
      }

      setShowModal(false);
      setEditingRecord(null);
      setFormData({
        workerId: '',
        checkIn: new Date().toISOString().slice(0, 16),
        checkOut: '',
        status: 'PRESENT',
        remarks: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      workerId: record.worker.id.toString(),
      checkIn: new Date(record.checkIn).toISOString().slice(0, 16),
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : '',
      status: record.status,
      remarks: record.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      const token = await getToken();
      await api.deleteAttendance(id, token || undefined);
      fetchData();
    } catch (error) {
      console.error('Failed to delete attendance:', error);
      alert(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const dailyAttendance = attendance.filter(record => new Date(record.checkIn).toISOString().split('T')[0] === dateFilter);
  const presentCount = dailyAttendance.filter(a => a.status?.toUpperCase() === 'PRESENT').length;
  const leaveCount = dailyAttendance.filter(a => a.status?.toUpperCase() === 'ON_LEAVE').length;

  const filteredAttendance = attendance
    .filter(record => {
      const matchesSearch = (record.worker.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const recordDate = new Date(record.checkIn).toISOString().split('T')[0];
      const matchesDate = recordDate === dateFilter;
      
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        const s = record.status?.toUpperCase();
        if (statusFilter === 'WORKING') matchesStatus = s === 'PRESENT' && !record.checkOut;
        else if (statusFilter === 'COMPLETED') matchesStatus = s === 'PRESENT' && !!record.checkOut;
        else if (statusFilter === 'HALF_DAY') matchesStatus = s === 'HALF_DAY' || s === 'PARTIAL';
        else matchesStatus = s === statusFilter;
      }
      
      return matchesSearch && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortConfig.key === 'name') {
        const nameA = (a.worker.user?.name || '').toLowerCase();
        const nameB = (b.worker.user?.name || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else {
        const timeA = new Date(a.checkIn).getTime();
        const timeB = new Date(b.checkIn).getTime();
        comparison = timeA - timeB;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

  const activeWorkersCount = workers.filter(w => w.status !== 'Inactive').length;
  const attendanceRate = activeWorkersCount > 0 ? ((presentCount / activeWorkersCount) * 100).toFixed(0) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">Attendance & HR Module</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-tight opacity-70">Track daily attendance and manage leave</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-green-100 dark:shadow-none"
          >
            <QrCode className="w-5 h-5" />
            Scan QR
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                workerId: '',
                checkIn: new Date().toISOString().slice(0, 16),
                checkOut: '',
                status: 'PRESENT',
                remarks: ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-blue-100 dark:shadow-none"
          >
            <Clock className="w-5 h-5" />
            Record Attendance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Today's Date</p>
          <p className="text-left text-lg font-black text-foreground">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Present</p>
          <p className="text-left text-2xl font-black text-green-600 dark:text-green-400">{presentCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">On Leave</p>
          <p className="text-left text-2xl font-black text-orange-600 dark:text-orange-400">{leaveCount}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Attendance Rate</p>
          <p className="text-left text-2xl font-black text-foreground">
            {attendanceRate}%
          </p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search worker by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-card text-foreground font-bold"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-black uppercase tracking-tight outline-none text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="WORKING">Working</option>
                <option value="COMPLETED">Completed</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-muted border border-border rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-500 transition-all text-foreground"
            />

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
              <button
                onClick={() => setSortConfig({ ...sortConfig, key: 'name' })}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortConfig.key === 'name' 
                    ? 'bg-card text-blue-600 shadow-sm border border-border' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                By Name
              </button>
              <button
                onClick={() => setSortConfig({ ...sortConfig, key: 'time' })}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortConfig.key === 'time' 
                    ? 'bg-card text-blue-600 shadow-sm border border-border' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                By Time
              </button>
            </div>

             <button
                onClick={() => setSortConfig({
                  ...sortConfig,
                  direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
                })}
                title={sortConfig.direction === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                className="p-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg transition-colors"
             >
                <ArrowUpDown className={`w-4 h-4 transition-transform duration-200 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
             </button>
          </div>
        </div>
        {(searchTerm || statusFilter !== 'ALL' || dateFilter !== new Date().toISOString().split('T')[0]) && (
          <div className="flex justify-end pt-2 border-t border-border">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setDateFilter(new Date().toISOString().split('T')[0]);
              }}
              className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-widest"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-black text-foreground flex items-center gap-2 uppercase tracking-widest text-left text-sm">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Attendance for {new Date(dateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/20">
              <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Worker Name</th>
              <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Check In</th>
              <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Check Out</th>
              <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Status</th>
              <th className="text-right py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-wider border-b border-border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendance.length > 0 ? (
              filteredAttendance.map((record) => (
                <tr key={record.id} className="border-b border-border/50 last:border-0 hover:bg-blue-50/10 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="py-3 px-4 text-sm font-black text-foreground uppercase tracking-tight">{record.worker.user?.name || 'Unnamed Worker'}</td>
                  <td className="py-3 px-4 text-sm text-foreground font-bold">{new Date(record.checkIn).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-foreground font-bold">{record.checkOut ? new Date(record.checkOut).toLocaleString() : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {record.status?.toUpperCase() === 'PRESENT' && (
                        <div className="flex items-center gap-2 text-left">
                          {!record.checkOut ? (
                            <>
                              <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </div>
                              <span className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-wider">Working</span>
                            </>
                          ) : (
                            <>
                              <div className="flex -space-x-1">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 -ml-2" />
                              </div>
                              <span className="text-xs font-black text-green-700 dark:text-green-300 uppercase tracking-widest">Completed</span>
                            </>
                          )}
                        </div>
                      )}
                      {(record.status?.toUpperCase() === 'HALF_DAY' || record.status?.toUpperCase() === 'PARTIAL') && (
                        <div className="flex items-center gap-2 text-left">
                          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Half Day</span>
                        </div>
                      )}
                      {record.status?.toUpperCase() === 'ABSENT' && (
                        <div className="flex items-center gap-2 text-left">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider">Absent</span>
                        </div>
                      )}
                      {record.status?.toUpperCase() === 'ON_LEAVE' && (
                        <div className="flex items-center gap-2 text-left">
                          <CalendarIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">On Leave</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2 text-left">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-muted-foreground font-black uppercase tracking-widest bg-muted/10 opacity-50 text-xs">
                  No attendance records found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-[60] backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-green-50 dark:bg-green-950/30">
              <h2 className="text-xl font-black text-green-900 dark:text-green-400 flex items-center gap-2 uppercase tracking-tighter text-left">
                <QrCode className="w-6 h-6" />
                Scan Worker QR
              </h2>
              <button
                onClick={stopScanner}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-green-200 dark:border-green-900/50 bg-muted/30 aspect-square"></div>
              <p className="text-center text-xs text-muted-foreground mt-4 font-black uppercase tracking-widest opacity-70">
                Position the worker's QR code within the frame to scan
              </p>
            </div>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
              <button
                onClick={stopScanner}
                className="px-8 py-2 bg-card border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
              <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter text-left">
                {editingRecord ? 'Edit Attendance' : 'Record Attendance'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left text-left">Worker *</label>
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
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left text-left">Check In *</label>
                <input
                  required
                  type="datetime-local"
                  value={formData.checkIn || ''}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left text-left">Check Out</label>
                <input
                  type="datetime-local"
                  value={formData.checkOut || ''}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left text-left">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                >
                  <option value="PRESENT">Present</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left text-left">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none bg-card text-foreground font-bold"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingRecord ? 'Update Record' : 'Record Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
