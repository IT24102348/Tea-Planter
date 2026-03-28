import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Users, Mail, Phone, Calendar, Loader2, QrCode, Download } from 'lucide-react';
import { useUser, useAuth } from "@clerk/clerk-react";
import { api } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface Worker {
  id: number;
  workerFunctions: string; // Comma-separated: Harvester, Pruner, etc.
  qrCode?: string;
  joinDate: string;
  assignedBlock: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  monthlyHarvest: number;
  user?: {
    id?: number;
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    birthday?: string;
    bankName?: string;
    branchName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    emergencyContact?: string;
    profileImageUrl?: string;
  };
}

export function WorkforcePage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserSearchModal, setShowUserSearchModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    roles: [] as string[],
    assignedBlock: '',
    status: 'Active' as const,
    joinDate: new Date().toISOString().split('T')[0],
    workerPin: ''
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');

  const [plots, setPlots] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'attendance' | 'harvest'>('info');
  const [history, setHistory] = useState({
    tasks: [] as any[],
    attendance: [] as any[],
    harvests: [] as any[],
    leaves: [] as any[]
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modalRefreshing, setModalRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedWorkerForQr, setSelectedWorkerForQr] = useState<Worker | null>(null);

  const handleViewQr = async (worker: Worker) => {
    setSelectedWorkerForQr(worker);
    setShowQrModal(true);
    
    // If worker doesn't have a QR code, generate it
    if (!worker.qrCode) {
      try {
        const token = await getToken();
        const updatedWorker = await api.generateWorkerQr(worker.id, token || undefined);
        setSelectedWorkerForQr(updatedWorker);
        // Update the worker in the main list too
        setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        toast.error('Failed to generate QR code');
      }
    }
  };

  const downloadQr = () => {
    const svg = document.getElementById('worker-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${selectedWorkerForQr?.user?.name || 'worker'}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const { user } = useUser();
  const { getToken } = useAuth();
  const plantationId = user?.publicMetadata?.plantationId as string | undefined;

  const fetchWorkers = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setModalRefreshing(true);
    setSyncError(null);
    try {
      const token = await getToken();
      const [workerData, userData, plotData] = await Promise.all([
        api.getWorkers(plantationId, token || undefined),
        api.getAvailableUsers(token || undefined),
        api.getPlots(plantationId, token || undefined).catch(() => [])
      ]);

      console.log('DEBUG: Workforce data fetched', { workers: workerData, availableUsers: userData });
      setWorkers(workerData);
      setAvailableUsers(userData);
      setPlots(plotData);
    } catch (error: any) {
      console.error('CRITICAL: Workforce fetch failed!', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error) || 'Unknown connection error';
      setSyncError(`Sync Error: ${errorMessage}`);
    } finally {
      if (isInitial) setLoading(false);
      setModalRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (editingWorker) {
        // Build a lean payload to avoid accidental relationship overwriting (fixes Unnamed Worker issue)
        const submissionData = {
          workerFunctions: formData.roles.join(', '),
          assignedBlock: formData.assignedBlock,
          status: formData.status,
          joinDate: formData.joinDate
        };
        await api.updateWorker(editingWorker.id, submissionData, token || undefined);
      } else {
        // Find if this is a registration for an existing user
        if (formData.userId) {
          // If userId exists, it means we are assigning from registered users
          await api.assignWorker(
            parseInt(formData.userId),
            formData.roles.join(', ') || 'Worker', // Use selected roles or fallback to 'Worker'
            plantationId ? parseInt(plantationId) : 1,
            formData.workerPin,
            token || undefined
          );
        } else {
          // Fallback to old behavior or handle direct add
          console.warn('Direct Add Worker not fully implemented with Auth yet');
        }
      }
      fetchWorkers();
      setShowModal(false);
      setUserSearchTerm('');
      fetchWorkers();
    } catch (error: any) {
      console.error('Failed to save worker:', error);

      // Show specific error messages
      const errorMessage = error?.message || 'Failed to save worker.';

      if (errorMessage.includes('security PIN')) {
        alert('❌ Worker Assignment Failed\n\n' +
          'The selected worker has not set their security PIN yet.\n\n' +
          '📝 Next Steps:\n' +
          '1. Ask the worker to log in to their account\n' +
          '2. Go to Settings page\n' +
          '3. Set a 6-digit security PIN\n' +
          '4. Try assigning them again');
      } else if (errorMessage.includes('already assigned')) {
        alert('❌ Worker Assignment Failed\n\n' +
          'This worker is already assigned to this plantation.');
      } else if (errorMessage.includes('PIN')) {
        alert('❌ Worker Assignment Failed\n\n' +
          'Invalid PIN. Please check the PIN and try again.');
      } else {
        alert('❌ Failed to save worker\n\n' + errorMessage);
      }
    } finally {
      setIsSubmitting(false);

    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      userId: worker.user?.id?.toString() || '',
      roles: worker.workerFunctions ? worker.workerFunctions.split(', ') : [],
      assignedBlock: worker.assignedBlock || '',
      status: worker.status,
      joinDate: worker.joinDate,
      workerPin: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this worker record?')) return;
    try {
      const token = await getToken();
      await api.deleteWorker(id, token || undefined);
      fetchWorkers();
    } catch (error) {
      console.error('Failed to delete worker:', error);
      alert('Failed to delete worker.');
    }
  };

  const handleViewDetails = async (worker: Worker) => {
    setSelectedWorker(worker);
    setShowDetailsModal(true);
    setLoadingHistory(true);
    setActiveTab('info');
    try {
      const token = await getToken();
      const [tasks, attendance, harvests, leaves] = await Promise.all([
        api.getTasksByWorker(worker.id, token || undefined).catch(() => []),
        api.getAttendanceByWorker(worker.id, token || undefined).catch(() => []),
        api.getHarvestsByWorker(worker.id, token || undefined).catch(() => []),
        api.getLeavesByWorker(worker.id, token || undefined).catch(() => [])
      ]);
      setHistory({ tasks, attendance, harvests, leaves });
    } catch (error) {
      console.error('Failed to fetch worker history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredWorkers = useMemo(() => {
    let result = workers.filter((worker) => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch =
        (worker.user?.name || '').toLowerCase().includes(searchStr) ||
        (worker.user?.email || '').toLowerCase().includes(searchStr) ||
        (worker.workerFunctions || '').toLowerCase().includes(searchStr) ||
        (worker.assignedBlock || '').toLowerCase().includes(searchStr);

      const matchesStatus = filterStatus === 'ALL' || worker.status === filterStatus;
      
      // Robust Role Filtering (case-insensitive and handles multiple roles)
      const workerRoles = (worker.workerFunctions || '').toLowerCase();
      const targetRole = filterRole.toLowerCase();
      const matchesRole = filterRole === 'ALL' || workerRoles.includes(targetRole);
      
      const matchesBlock = filterBlock === 'ALL' || worker.assignedBlock === filterBlock;

      return matchesSearch && matchesStatus && matchesRole && matchesBlock;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.user?.name || '').localeCompare(b.user?.name || '');
      }
      if (sortBy === 'joinDate') {
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      }
      if (sortBy === 'yield') {
        return (b.monthlyHarvest || 0) - (a.monthlyHarvest || 0);
      }
      return 0;
    });
  }, [workers, searchTerm, filterStatus, filterRole, filterBlock, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workforce Management</h1>
          <p className="text-muted-foreground mt-1 text-left">Manage workers and task assignments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchWorkers();
              setUserSearchTerm('');
              setShowUserSearchModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-bold transition-all"
          >
            <Search className="w-5 h-5" />
            Search Registered Users
          </button>
          <button
            onClick={() => {
              setEditingWorker(null);
              setFormData({
                userId: '',
                roles: [] as string[],
                assignedBlock: '',
                status: 'Active',
                joinDate: new Date().toISOString().split('T')[0],
                workerPin: ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-sm shadow-blue-100 dark:shadow-none"
          >
            <Plus className="w-5 h-5" />
            Add Worker
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
            >
              <option value="ALL">All Roles</option>
              {['Harvester', 'Pruner', 'Supervisor', 'Driver', 'Maintenance', 'Field Worker', 'Security'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
            >
              <option value="ALL">All Blocks</option>
              {Array.from(new Set(workers.map(w => w.assignedBlock).filter(Boolean))).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 border-l pl-2 ml-2 border-border">
              <span className="text-sm text-muted-foreground font-bold uppercase tracking-tighter">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
              >
                <option value="name">Name (A-Z)</option>
                <option value="joinDate">Join Date (Newest)</option>
                <option value="yield">Monthly Yield</option>
              </select>
            </div>
          </div>
        </div>
        {(searchTerm || filterStatus !== 'ALL' || filterRole !== 'ALL' || filterBlock !== 'ALL') && (
          <div className="flex justify-end pt-2 border-t border-border/50">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setFilterRole('ALL');
                setFilterBlock('ALL');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 uppercase"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-medium text-left">Total Workers</p>
          <p className="text-2xl font-bold text-foreground text-left">{workers.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-medium text-left">Active</p>
          <p className="text-2xl font-bold text-green-600 text-left">{workers.filter(w => w.status === 'Active').length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-medium text-left">On Leave</p>
          <p className="text-2xl font-bold text-orange-600 text-left">{workers.filter(w => w.status === 'On Leave').length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1 font-medium text-left">Avg Monthly Harvest</p>
          <p className="text-2xl font-bold text-foreground text-left">
            {workers.filter(w => w.monthlyHarvest > 0).length > 0
              ? (workers.reduce((s, w) => s + w.monthlyHarvest, 0) / workers.filter(w => w.monthlyHarvest > 0).length).toFixed(0)
              : 0} kg
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Worker</th>
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Contact</th>
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Role</th>
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Assigned Block</th>
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Status</th>
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Monthly Harvest</th>
              <th className="text-left py-3 px-4 text-sm font-bold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewDetails(worker)}
                        className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-all overflow-hidden border-2 border-border/50 shadow-md flex-shrink-0"
                      >
                        {worker.user?.profileImageUrl ? (
                          <img 
                            src={worker.user.profileImageUrl} 
                            alt={worker.user.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{(worker.user?.name || 'W').charAt(0)}</span>
                        )}
                      </button>
                      <div>
                        <button
                          onClick={() => handleViewDetails(worker)}
                          className="font-bold text-foreground hover:text-blue-600 transition-colors text-left"
                        >
                          {worker.user?.name || 'Unnamed Worker'}
                        </button>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                          <Calendar className="w-3 h-3" />
                          JOINED {worker.joinDate.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <p className="text-xs text-foreground flex items-center gap-1 font-medium">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      {worker.user?.email || 'No email'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {worker.user?.phone || 'No phone'}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {worker.workerFunctions ? worker.workerFunctions.split(', ').map(r => (
                      <span key={r} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-100 dark:border-blue-800/20">
                        {r.toUpperCase()}
                      </span>
                    )) : '-'}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm font-bold text-foreground text-left">{worker.assignedBlock}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-bold ${worker.status === 'Active' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                    worker.status === 'On Leave' ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                    {worker.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm font-bold text-foreground text-left">
                  {worker.monthlyHarvest > 0 ? `${worker.monthlyHarvest} kg` : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewQr(worker)}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium mr-2 flex items-center gap-1"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                    <button
                      onClick={() => handleEdit(worker)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(worker.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium ml-2"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* User Search Modal */}
      {showUserSearchModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
              <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2 uppercase tracking-tighter">
                <Users className="w-6 h-6" />
                Find Registered Members
              </h2>
              <div className="flex items-center gap-3">
                {modalRefreshing && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 animate-pulse text-xs font-bold uppercase">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing from Clerk...
                  </div>
                )}
                <button
                  onClick={() => setShowUserSearchModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {syncError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs flex items-center justify-between font-bold uppercase tracking-tight">
                  <span>{syncError}</span>
                  <button
                    onClick={() => fetchWorkers()}
                    className="underline font-black hover:text-red-800 dark:hover:text-red-300"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>
                <button
                  onClick={() => fetchWorkers()}
                  disabled={modalRefreshing}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted flex items-center gap-2 text-xs font-bold uppercase transition-all disabled:opacity-50 text-foreground"
                  title="Force Sync from Clerk"
                >
                  <Loader2 className={`w-4 h-4 ${modalRefreshing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>

              <div className="max-h-[40vh] overflow-y-auto border border-gray-100 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-900 border-b">Member</th>
                      <th className="text-left p-3 font-semibold text-gray-900 border-b">Email</th>
                      <th className="text-right p-3 font-semibold text-gray-900 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableUsers
                      .filter(u =>
                        (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map(u => (
                        <tr key={u.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                          <td className="p-3 border-b border-border/50 font-bold text-foreground">{u.name}</td>
                          <td className="p-3 border-b border-border/50 text-muted-foreground">{u.email}</td>
                          <td className="p-3 border-b border-border/50 text-right">
                            <button
                              onClick={() => {
                                setFormData({
                                  userId: u.id.toString(),
                                  roles: [] as string[],
                                  assignedBlock: '',
                                  status: 'Active',
                                  joinDate: new Date().toISOString().split('T')[0],
                                  workerPin: ''
                                });
                                setShowUserSearchModal(false);
                                setShowModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                    {availableUsers.length === 0 && !modalRefreshing && (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-muted-foreground">
                          {syncError ? 'Unable to load users.' : 'No registered members found. They must login to the app first.'}
                        </td>
                      </tr>
                    )}
                    {modalRefreshing && availableUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Fetching users from your Clerk Dashboard...</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && selectedWorkerForQr && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-[70] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-orange-50 dark:bg-orange-950/30">
              <h2 className="text-xl font-bold text-orange-900 dark:text-orange-400 flex items-center gap-2 uppercase tracking-tighter">
                <QrCode className="w-6 h-6" />
                Worker QR Code
              </h2>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center gap-6">
              <div className="p-4 bg-white dark:bg-slate-200 rounded-xl shadow-inner border border-border/50">
                {selectedWorkerForQr.qrCode ? (
                  <QRCodeSVG
                    id="worker-qr"
                    value={selectedWorkerForQr.qrCode}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-600 dark:text-orange-400" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-foreground uppercase tracking-widest">{selectedWorkerForQr.user?.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-2 bg-muted/50 px-3 py-1 rounded-full border border-border/50">{selectedWorkerForQr.qrCode || 'GENERATING...'}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-muted/30 border-t border-border flex gap-3">
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-muted transition-all"
              >
                Close
              </button>
              <button
                onClick={downloadQr}
                disabled={!selectedWorkerForQr.qrCode}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-orange-100 dark:shadow-none"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 uppercase tracking-tighter">
                  {editingWorker ? 'Edit Worker Profile' : 'Register New Worker'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isSubmitting}
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {!editingWorker && (
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tighter text-left">Select Registered Member *</label>

                    {/* User Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search member by name or email..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
                      />
                    </div>

                    <select
                      required
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
                    >
                      <option value="">Select a member...</option>
                      {availableUsers
                        .filter(u =>
                          (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                        )
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase text-left opacity-70">Only members who have logged in and are not yet assigned will appear here.</p>
                  </div>
                )}

                {/* PIN Field for Assignment */}
                {!editingWorker && (
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tighter text-left mb-1">
                      Target Worker's 6-Digit Security PIN *
                    </label>
                    <input
                      required={!editingWorker}
                      type="text"
                      maxLength={6}
                      placeholder="Enter the worker's security PIN"
                      value={formData.workerPin}
                      onChange={(e) => setFormData({ ...formData, workerPin: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase text-left opacity-70 mt-1">
                      The worker must have set this PIN in their own Settings page and shared it with you.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tighter text-left mb-1">Roles (Can select multiple) *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                    {['Harvester', 'Pruner', 'Supervisor', 'Driver', 'Maintenance', 'Field Worker', 'Security'].map(role => (
                      <label key={role} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role)}
                          onChange={(e) => {
                            const newRoles = e.target.checked
                              ? [...formData.roles, role]
                              : formData.roles.filter(r => r !== role);
                            setFormData({ ...formData, roles: newRoles });
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-border bg-card cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase group-hover:text-blue-600 transition-colors">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tighter text-left mb-1">Assigned Block</label>
                    <input
                      type="text"
                      placeholder="e.g. Block A-01"
                      value={formData.assignedBlock}
                      onChange={(e) => setFormData({ ...formData, assignedBlock: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tighter text-left mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tighter text-left mb-1">Join Date</label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-muted transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-100 dark:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingWorker ? 'Update Profile' : 'Register Worker'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {/* Worker Details Modal */}
      {
        showDetailsModal && selectedWorker && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-border">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border-2 border-border shadow-sm">
                    {selectedWorker.user?.profileImageUrl ? (
                      <img src={selectedWorker.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 uppercase tracking-tighter">{selectedWorker.user?.name}</h2>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">{selectedWorker.workerFunctions}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-muted dark:hover:bg-blue-950/50 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex border-b border-border bg-muted/30">
                {(['info', 'tasks', 'attendance', 'harvest'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors relative ${activeTab === tab
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-left">Contact Details</h3>
                      <div className="space-y-2">
                        <p className="text-sm flex items-center gap-2 text-foreground font-bold"><Mail className="w-4 h-4 text-blue-500" /> {selectedWorker.user?.email || 'No email'}</p>
                        <p className="text-sm flex items-center gap-2 text-foreground font-bold"><Phone className="w-4 h-4 text-blue-500" /> {selectedWorker.user?.phone || 'No phone set'}</p>
                      </div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-left pt-2">Personal Info</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground font-medium text-left"><span className="text-muted-foreground font-bold uppercase text-[10px] mr-2">Gender:</span> {selectedWorker.user?.gender || 'Not specified'}</p>
                        <p className="text-sm text-foreground font-medium text-left"><span className="text-muted-foreground font-bold uppercase text-[10px] mr-2">Birthday:</span> {selectedWorker.user?.birthday || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-left">Employment</h3>
                      <div className="space-y-2 text-left">
                        <p className="text-sm text-foreground font-medium"><span className="text-muted-foreground font-bold uppercase text-[10px] mr-2">Status:</span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${selectedWorker.status === 'Active' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                            }`}>{selectedWorker.status}</span>
                        </p>
                        <p className="text-sm text-foreground font-medium"><span className="text-muted-foreground font-bold uppercase text-[10px] mr-2">Assigned Block:</span> {selectedWorker.assignedBlock || 'General'}</p>
                        <p className="text-sm text-foreground font-medium"><span className="text-muted-foreground font-bold uppercase text-[10px] mr-2">Join Date:</span> {selectedWorker.joinDate}</p>
                      </div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-left pt-2">Emergency Contact</h3>
                      <p className="text-sm text-foreground font-bold text-left bg-muted/30 p-2 rounded border border-border/50">{selectedWorker.user?.emergencyContact || 'None provided'}</p>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-left pt-2">Bank Info</h3>
                      <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
                        <p className="text-[10px] text-foreground flex justify-between">
                          <span className="font-black text-muted-foreground uppercase tracking-tighter">Bank</span>
                          <span className="font-bold">{selectedWorker.user?.bankName || 'N/A'}</span>
                        </p>
                        <p className="text-[10px] text-foreground flex justify-between">
                          <span className="font-black text-muted-foreground uppercase tracking-tighter">Branch</span>
                          <span className="font-bold">{selectedWorker.user?.branchName || 'N/A'}</span>
                        </p>
                        <p className="text-[10px] text-foreground flex justify-between">
                          <span className="font-black text-muted-foreground uppercase tracking-tighter">A/C No</span>
                          <span className="font-mono font-black text-blue-700 dark:text-blue-400">{selectedWorker.user?.accountNumber || 'N/A'}</span>
                        </p>
                        <p className="text-[10px] text-foreground flex justify-between">
                          <span className="font-black text-muted-foreground uppercase tracking-tighter">Holder</span>
                          <span className="font-bold">{selectedWorker.user?.accountHolderName || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="space-y-3">
                    {loadingHistory ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" /></div>
                    ) : history.tasks.length > 0 ? (
                      history.tasks.map((task: any) => (
                        <div key={task.id} className="p-3 border border-border rounded-lg bg-muted/30 flex justify-between items-center hover:border-blue-500/50 transition-colors">
                          <div className="text-left">
                            <p className="font-bold text-foreground text-sm uppercase tracking-tight">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{task.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${task.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                            }`}>{task.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-sm text-muted-foreground font-bold uppercase tracking-widest">No task history found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className="space-y-3">
                    {loadingHistory ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" /></div>
                    ) : history.attendance.length > 0 ? (
                      history.attendance.map((record: any) => (
                        <div key={record.id} className="p-3 border border-border rounded-lg bg-muted/30 flex justify-between items-center hover:border-blue-500/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-foreground">
                                {new Date(record.checkIn).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                {new Date(record.checkIn).toLocaleTimeString()} - {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'PRESENT'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded text-[10px] font-black uppercase">{record.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-sm text-muted-foreground font-bold uppercase tracking-widest">No attendance records found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'harvest' && (
                  <div className="space-y-3">
                    {loadingHistory ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" /></div>
                    ) : history.harvests.length > 0 ? (
                      history.harvests.map((h: any) => (
                        <div key={h.id} className="p-3 border border-border rounded-lg bg-muted/30 flex justify-between items-center hover:border-blue-500/50 transition-colors">
                          <div className="text-left">
                            <p className="text-sm font-bold text-foreground">{new Date(h.harvestDate).toLocaleDateString()}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Plot: {h.plot?.blockId || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-foreground text-sm">{h.netWeight} kg</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Net Weight</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-12 text-sm text-muted-foreground font-bold uppercase tracking-widest">No harvest records found.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-card border border-border rounded-lg text-foreground font-black uppercase tracking-widest text-xs hover:bg-muted transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
