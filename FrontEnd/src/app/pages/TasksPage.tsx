import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Clock, Plus, Calendar, User, MapPin, Edit2, Trash2, Settings2, Filter, ArrowUpDown } from 'lucide-react';
import { useAuth, useUser } from "@clerk/clerk-react";
import { api } from '@/lib/api';

interface Task {
    id: number;
    title: string;
    description: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    createdAt: string;
    assignedWorker: {
        id: number;
        user?: { name: string };
    } | null;
    plotId: string;
    taskCategory: string;
    paymentAmount?: number;
    taskDate: string;
}

export function TasksPage() {
    const { user } = useUser();
    const { isLoaded, getToken } = useAuth();

    const userRole = user?.publicMetadata?.role as 'owner' | 'clerk' | 'worker' | undefined;
    const plantationId = user?.publicMetadata?.plantationId as string | undefined;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [blockFilter, setBlockFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('date-desc');

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [workers, setWorkers] = useState<any[]>([]);
    const [plots, setPlots] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignFormData, setAssignFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        workerId: '',
        plotId: '',
        taskCategory: '',
        taskDate: new Date().toISOString().split('T')[0]
    });

    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Dynamic Task Rates State
    const [taskRates, setTaskRates] = useState<any[]>([]);
    const [showRateModal, setShowRateModal] = useState(false);
    const [editingRate, setEditingRate] = useState<any | null>(null);
    const [rateFormData, setRateFormData] = useState({
        category: '',
        rate: '',
        unit: 'PER_PROCESS',
        description: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [taskData, workerData, plotData, rateData] = await Promise.all([
                api.getTasks(selectedMonth, plantationId, token || undefined),
                api.getWorkers(plantationId, token || undefined),
                api.getPlots(plantationId, token || undefined).catch(() => []),
                api.getTaskRates(token || undefined)
            ]);
            setTasks(taskData);
            setWorkers(workerData);
            setPlots(plotData);
            setTaskRates(rateData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            fetchData();
        }
    }, [selectedMonth, isLoaded]);

    const handleAssignTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignFormData.workerId || !assignFormData.taskCategory) {
            alert('Please select a worker and a task category');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            if (editingTask) {
                await api.updateTask(editingTask.id, {
                    ...assignFormData,
                    workerId: parseInt(assignFormData.workerId)
                }, token || undefined);
                alert('Task updated successfully!');
            } else {
                await api.createTask({
                    ...assignFormData,
                    workerId: parseInt(assignFormData.workerId),
                    plantationId: plantationId ? parseInt(plantationId) : null
                }, token || undefined);
                alert('Task assigned successfully!');
            }
            setShowAssignModal(false);
            setEditingTask(null);
            setAssignFormData({
                title: '',
                description: '',
                priority: 'MEDIUM',
                workerId: '',
                plotId: '',
                taskCategory: '',
                taskDate: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error: any) {
            console.error('Failed to save task:', error);
            const errorMessage = error.message || (typeof error === 'string' ? error : 'Unknown error');
            alert(`Failed to save task: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            const token = await getToken();
            await api.deleteTask(taskId, token || undefined);
            fetchData();
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete task');
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setAssignFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            workerId: task.assignedWorker?.id.toString() || '',
            plotId: task.plotId || '',
            taskCategory: task.taskCategory || '',
            taskDate: task.taskDate || new Date().toISOString().split('T')[0]
        });
        setShowAssignModal(true);
    };

    const handleUpdateStatus = async (taskId: number, newStatus: string) => {
        try {
            const token = await getToken();
            await api.updateTaskStatus(taskId, newStatus, token || undefined);
            fetchData();
        } catch (error) {
            console.error('Failed to update task status:', error);
            alert('Failed to update status');
        }
    };

    const filteredTasks = useMemo(() => {
        let result = tasks.filter((task) => {
            const matchesSearch =
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (task.assignedWorker?.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
            const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
            const matchesBlock = blockFilter === 'ALL' || task.plotId === blockFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesBlock;
        });

        result.sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.taskDate).getTime() - new Date(a.taskDate).getTime();
            if (sortBy === 'date-asc') return new Date(a.taskDate).getTime() - new Date(b.taskDate).getTime();
            if (sortBy === 'priority-high') {
                const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
                return pMap[b.priority] - pMap[a.priority];
            }
            return 0;
        });

        return result;
    }, [tasks, searchTerm, statusFilter, priorityFilter, blockFilter, sortBy]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return 'text-red-600 bg-red-50';
            case 'MEDIUM':
                return 'text-orange-600 bg-orange-50';
            default:
                return 'text-blue-600 bg-blue-50';
        }
    };

    const handleSaveRate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const payload = {
                ...rateFormData,
                rate: parseFloat(rateFormData.rate)
            };

            if (editingRate) {
                await api.updateTaskRate(editingRate.id, payload, token || undefined);
            } else {
                await api.createTaskRate(payload, token || undefined);
            }

            setShowRateModal(false);
            setEditingRate(null);
            setRateFormData({
                category: '',
                rate: '',
                unit: 'PER_PROCESS',
                description: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to save rate:', error);
            alert('Failed to save task type');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRate = async (id: number) => {
        if (!confirm('Are you sure you want to delete this task type? This might affect existing task records.')) return;
        try {
            const token = await getToken();
            await api.deleteTaskRate(id, token || undefined);
            fetchData();
        } catch (error) {
            console.error('Failed to delete rate:', error);
            alert('Failed to delete task type');
        }
    };

    if (loading || !isLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-green-600 dark:text-green-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 text-left">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Task Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Period:</p>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-2 py-0.5 border border-border rounded text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
                        />
                    </div>
                </div>
                {(userRole === 'owner' || userRole === 'clerk') && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setEditingRate(null);
                                setRateFormData({
                                    category: '',
                                    rate: '',
                                    unit: 'PER_PROCESS',
                                    description: ''
                                });
                                setShowRateModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-md shadow-blue-100 dark:shadow-none"
                        >
                            <Settings2 className="w-4 h-4" />
                            Manage Types
                        </button>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-md shadow-green-100 dark:shadow-none"
                        >
                            <Plus className="w-4 h-4" />
                            Assign Task
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-lg border border-border p-4 space-y-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-muted-foreground/50 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search tasks, descriptions or workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight text-xs"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-tight outline-none text-foreground"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ASSIGNED">Assigned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 border border-border rounded-lg text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-green-500 outline-none bg-muted text-foreground"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="HIGH">High Priority</option>
                            <option value="MEDIUM">Medium Priority</option>
                            <option value="LOW">Low Priority</option>
                        </select>
                        <select
                            value={blockFilter}
                            onChange={(e) => setBlockFilter(e.target.value)}
                            className="px-3 py-2 border border-border rounded-lg text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-green-500 outline-none bg-muted text-foreground"
                        >
                            <option value="ALL">All Blocks</option>
                            {plots.map(p => (
                                <option key={p.id} value={p.blockId}>{p.blockId}</option>
                            ))}
                        </select>
                        <div className="h-8 w-px bg-border hidden md:block" />
                        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
                            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-tight outline-none text-foreground"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="priority-high">Priority High-Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || blockFilter !== 'ALL') && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
                            Found <span className="text-green-600 dark:text-green-400">{filteredTasks.length}</span> results
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('ALL');
                                setPriorityFilter('ALL');
                                setBlockFilter('ALL');
                            }}
                            className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-widest transition-all"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                    <div key={task.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border border-border ${
                                    task.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                                    task.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.1em] ${
                                    task.priority === 'HIGH' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20' :
                                    task.priority === 'MEDIUM' ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20' :
                                    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
                                }`}>
                                    {task.priority} PRIORITY
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase mb-3 tracking-widest opacity-70">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="font-semibold">{new Date(task.taskDate).toLocaleDateString()}</span>
                            </div>

                            <div className="space-y-2 mt-auto">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="text-foreground">
                                        {task.assignedWorker?.user?.name || 'Unassigned'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-foreground">
                                        {task.plotId || 'General'}
                                    </span>
                                </div>
                                {task.taskCategory && (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded uppercase tracking-[0.1em] border border-blue-100/50 dark:border-blue-900/30">
                                        {task.taskCategory}
                                        {task.paymentAmount && (
                                            <span className="ml-auto text-green-700 dark:text-green-400">LKR {task.paymentAmount.toLocaleString()}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-muted/30 rounded-lg p-3 mt-4 border-l-4 border-green-500/50 text-left">
                                <p className="text-sm text-foreground font-bold tracking-tight opacity-80 whitespace-pre-wrap leading-relaxed break-words italic">
                                    {task.description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        <div className="px-5 py-2 flex justify-end gap-2 border-t border-border bg-muted/10">
                            {userRole !== 'worker' && (
                                <button
                                    onClick={() => openEditModal(task)}
                                    className="p-1 px-2 text-blue-600 dark:text-blue-400 hover:underline transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    EDIT
                                </button>
                            )}
                            {(task.status === 'ASSIGNED' || userRole === 'owner') && (
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1 px-2 text-red-600 dark:text-red-400 hover:underline transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    DELETE
                                </button>
                            )}
                        </div>

                        <div className="bg-muted px-5 py-3 border-t border-border flex justify-between items-center gap-2">
                            <select
                                className="text-[10px] font-black uppercase tracking-widest bg-card border border-border rounded px-2 py-1 outline-none text-foreground"
                                value={task.status}
                                onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            >
                                <option value="ASSIGNED">Assigned</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <button
                                onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                                disabled={task.status === 'COMPLETED'}
                                className="text-[10px] font-black uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground px-4 py-1.5 rounded transition-all shadow-sm"
                            >
                                Mark Done
                            </button>
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-muted/10 rounded-xl border border-dashed border-border opacity-50">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No tasks found matching your filters.</p>
                    </div>
                )}
            </div>

            {/* Assign Task Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-border">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-green-50 dark:bg-green-950/30">
                            <h2 className="text-xl font-black text-green-900 dark:text-green-400 uppercase tracking-tighter">{editingTask ? 'Edit Task' : 'Assign New Task'}</h2>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setEditingTask(null);
                                    setAssignFormData({
                                        title: '',
                                        description: '',
                                        priority: 'MEDIUM',
                                        workerId: '',
                                        plotId: '',
                                        taskCategory: '',
                                        taskDate: new Date().toISOString().split('T')[0]
                                    });
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isSubmitting}
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Worker *</label>
                                <select
                                    required
                                    value={assignFormData.workerId}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, workerId: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                >
                                    <option value="">Select Worker</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.user?.name || 'Unnamed Worker'}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Task Title *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Pruning Block A"
                                    value={assignFormData.title}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold tracking-tight"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Task Category *</label>
                                <select
                                    required
                                    value={assignFormData.taskCategory}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, taskCategory: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                >
                                    <option value="">Select Category</option>
                                    {taskRates.map(rate => (
                                        <option key={rate.id} value={rate.category}>{rate.category} (LKR {rate.rate})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Task Date *</label>
                                <input
                                    required
                                    type="date"
                                    value={assignFormData.taskDate}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, taskDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Description</label>
                                <textarea
                                    value={assignFormData.description}
                                    onChange={(e) => setAssignFormData({ ...assignFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none bg-card text-foreground font-bold"
                                    placeholder="Add detailed instructions for the worker..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Priority</label>
                                    <select
                                        value={assignFormData.priority}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, priority: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Plot / Block</label>
                                    <select
                                        value={assignFormData.plotId}
                                        onChange={(e) => setAssignFormData({ ...assignFormData, plotId: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                    >
                                        <option value="">General / No Block</option>
                                        {plots.map(plot => (
                                            <option key={plot.id} value={plot.blockId}>{plot.blockId}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-border mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
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
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {editingTask ? 'Updating...' : 'Assigning...'}
                                        </>
                                    ) : (
                                        editingTask ? 'Update Task' : 'Assign Task'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Task Types Modal */}
            {showRateModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-border text-left">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
                            <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter">Manage Task Types & Rates</h2>
                            <button
                                onClick={() => setShowRateModal(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Form Side */}
                            <form onSubmit={handleSaveRate} className="space-y-4">
                                <h3 className="font-black text-foreground text-xs uppercase tracking-widest opacity-70 mb-4">{editingRate ? 'Edit Task Type' : 'Add New Task Type'}</h3>
                                <div>
                                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Task Name (Category) *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. PRUNING"
                                        value={rateFormData.category}
                                        onChange={(e) => setRateFormData({ ...rateFormData, category: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Rate (LKR) *</label>
                                        <input
                                            required
                                            type="number"
                                            placeholder="e.g. 50"
                                            value={rateFormData.rate}
                                            onChange={(e) => setRateFormData({ ...rateFormData, rate: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Unit</label>
                                        <select
                                            value={rateFormData.unit}
                                            onChange={(e) => setRateFormData({ ...rateFormData, unit: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                        >
                                            <option value="PER_KG">Per KG</option>
                                            <option value="PER_PROCESS">Per Process</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Details (Description)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Add task details..."
                                        value={rateFormData.description}
                                        onChange={(e) => setRateFormData({ ...rateFormData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-card text-foreground font-bold"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : (editingRate ? 'Update Type' : 'Create Type')}
                                    </button>
                                    {editingRate && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingRate(null);
                                                setRateFormData({ category: '', rate: '', unit: 'PER_PROCESS', description: '' });
                                            }}
                                            className="px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* List Side */}
                            <div className="space-y-4">
                                <h3 className="font-black text-foreground text-xs uppercase tracking-widest opacity-70 mb-4">Existing Task Types</h3>
                                <div className="border border-border rounded-lg overflow-y-auto max-h-[300px] bg-muted/20">
                                    {taskRates.map(rate => (
                                        <div key={rate.id} className="p-4 border-b border-border/50 last:border-0 hover:bg-muted group transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="text-left">
                                                    <p className="font-black text-sm text-foreground uppercase tracking-tight">{rate.category}</p>
                                                    <p className="text-xs text-green-700 dark:text-green-400 font-bold mt-1">LKR {rate.rate} / {rate.unit.replace('PER_', '')}</p>
                                                    {rate.description && <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">{rate.description}</p>}
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => {
                                                            setEditingRate(rate);
                                                            setRateFormData({
                                                                category: rate.category,
                                                                rate: rate.rate.toString(),
                                                                unit: rate.unit,
                                                                description: rate.description || ''
                                                            });
                                                        }}
                                                        className="p-1 px-2 text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        EDIT
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRate(rate.id)}
                                                        className="p-1 px-2 text-red-600 dark:text-red-400 hover:underline text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        DELETE
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {taskRates.length === 0 && (
                                        <div className="p-12 text-center text-muted-foreground text-xs font-black uppercase tracking-[0.2em] opacity-50">
                                            No task types defined yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
