import { useState, useEffect, useMemo } from 'react';
import { Truck, Plus, Loader2, Calendar, Weight, Building2, BarChart2, Filter, Search } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';

interface Factory {
    id: number;
    name: string;
}

interface DeliveryRecord {
    id: number;
    factory: Factory;
    weight: number;
    deliveryDate: string;
}

export function DeliveriesPage() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const plantationId = user?.publicMetadata?.plantationId as string | undefined;

    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<DeliveryRecord | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        factoryId: '',
        weight: '',
        deliveryDate: new Date().toISOString().split('T')[0]
    });
    const [factoryFilter, setFactoryFilter] = useState('ALL');
    
    // Advanced Search & Sorting State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'weight-desc' | 'weight-asc'>('date-desc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredDeliveries = useMemo(() => {
        return deliveries
            .filter(d => {
                const matchesFactory = factoryFilter === 'ALL' || d.factory?.name === factoryFilter;
                const matchesSearch = d.factory?.name.toLowerCase().includes(searchTerm.toLowerCase());
                const deliveryDate = new Date(d.deliveryDate);
                const matchesStart = !startDate || deliveryDate >= new Date(startDate);
                const matchesEnd = !endDate || deliveryDate <= new Date(endDate);
                return matchesFactory && matchesSearch && matchesStart && matchesEnd;
            })
            .sort((a, b) => {
                if (sortBy === 'date-desc') return new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime();
                if (sortBy === 'date-asc') return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
                if (sortBy === 'weight-desc') return b.weight - a.weight;
                if (sortBy === 'weight-asc') return a.weight - b.weight;
                return 0;
            });
    }, [deliveries, factoryFilter, searchTerm, sortBy, startDate, endDate]);

    const factoryStats = useMemo(() => {
        const stats: Record<string, number> = {};
        filteredDeliveries.forEach(d => {
            const factoryName = d.factory?.name || 'Unknown';
            stats[factoryName] = (stats[factoryName] || 0) + d.weight;
        });
        return Object.entries(stats).map(([name, weight]) => ({ name, weight }));
    }, [filteredDeliveries]);

    const chartColors = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#db2777'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [deliveryData, factoryData] = await Promise.all([
                api.getDeliveries(selectedMonth, plantationId, token || undefined),
                api.getFactories(plantationId, token || undefined)
            ]);
            setDeliveries(deliveryData);
            setFactories(factoryData);
        } catch (error) {
            console.error('Failed to fetch deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.factoryId || !formData.weight) {
            alert('Please fill in required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const data = {
                factory: { id: parseInt(formData.factoryId) },
                weight: parseFloat(formData.weight),
                deliveryDate: formData.deliveryDate,
                plantationId: plantationId
            };

            if (editingRecord) {
                await api.updateDelivery(editingRecord.id, data, token || undefined);
            } else {
                await api.recordDelivery(data, plantationId || '', token || undefined);
            }

            setShowModal(false);
            setEditingRecord(null);
            setFormData({ factoryId: '', weight: '', deliveryDate: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error: any) {
            console.error('Failed to record delivery:', error);
            alert(error.message || 'Failed to record delivery.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (record: DeliveryRecord) => {
        setEditingRecord(record);
        setFormData({
            factoryId: record.factory.id.toString(),
            weight: record.weight.toString(),
            deliveryDate: record.deliveryDate
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this delivery record?')) return;
        try {
            const token = await getToken();
            await api.deleteDelivery(id, token || undefined);
            fetchData();
        } catch (error) {
            console.error('Failed to delete delivery:', error);
            alert('Failed to delete delivery record.');
        }
    };

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
                    <h1 className="text-2xl font-bold text-foreground">Tea Deliveries</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Period:</p>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-2 py-0.5 border border-border rounded text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
                        />
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingRecord(null);
                        setFormData({ factoryId: '', weight: '', deliveryDate: new Date().toISOString().split('T')[0] });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-green-100 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Record Delivery
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-left">Total Weight</p>
                    </div>
                    <p className="text-2xl font-black text-foreground text-left">
                        {filteredDeliveries.reduce((sum, d) => sum + d.weight, 0).toLocaleString()} <span className="text-sm font-bold text-muted-foreground">kg</span>
                    </p>
                </div>
                {factoryStats.slice(0, 2).map((stat, idx) => (
                    <div key={stat.name} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-left">{stat.name}</p>
                        </div>
                        <p className="text-2xl font-black text-foreground text-left">
                            {stat.weight.toLocaleString()} <span className="text-sm font-bold text-muted-foreground">kg</span>
                        </p>
                    </div>
                ))}
            </div>

            {/* Comparison Chart */}
            {factoryStats.length > 0 && (
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-black text-foreground uppercase tracking-widest text-left">Factory Delivery Comparison</h2>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={factoryStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#888888" opacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'hsl(var(--muted-foreground))' }}
                                    width={100}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '8px',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Delivery Weight']}
                                />
                                <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={16}>
                                    {factoryStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <input
                                type="text"
                                placeholder="Search by factory name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-bold"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">From:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-2 py-1.5 border border-border rounded text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">To:</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-2 py-1.5 border border-border rounded text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-2 py-1.5 border border-border rounded text-sm focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                >
                                    <option value="date-desc">Newest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="weight-desc">Weight (High-Low)</option>
                                    <option value="weight-asc">Weight (Low-High)</option>
                                </select>
                            </div>
                            <div className="h-8 w-px bg-border hidden md:block"></div>
                            {(searchTerm || factoryFilter !== 'ALL' || startDate || endDate) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFactoryFilter('ALL');
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-widest"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/20 border-b border-border">
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Factory</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Weight (kg)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredDeliveries.map((d) => (
                                        <tr key={d.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-foreground font-bold">
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                    {new Date(d.deliveryDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-foreground font-black uppercase tracking-tight">
                                                    <Building2 className="w-4 h-4 text-blue-500" />
                                                    {d.factory?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <Weight className="w-4 h-4 text-green-500" />
                                                    <span className="font-black">{d.weight.toLocaleString()} kg</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 text-left">
                                                    <button
                                                        onClick={() => handleEdit(d)}
                                                        className="p-1 px-3 text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(d.id)}
                                                        className="p-1 px-3 text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {deliveries.length === 0 && (
                            <div className="text-center py-12">
                                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">No tea deliveries recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-green-50 dark:bg-green-950/30">
                            <h2 className="text-xl font-black text-green-900 dark:text-green-400 uppercase tracking-tighter text-left">
                                {editingRecord ? 'Update Tea Delivery' : 'Record Tea Delivery'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingRecord(null);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                disabled={isSubmitting}
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Select Factory *</label>
                                <select
                                    required
                                    value={formData.factoryId}
                                    onChange={(e) => setFormData({ ...formData, factoryId: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black uppercase tracking-tight"
                                >
                                    <option value="">Select Factory</option>
                                    {factories.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Weight (kg) *</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 text-left">Delivery Date *</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.deliveryDate}
                                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-card text-foreground font-black"
                                />
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-border mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-black uppercase tracking-widest text-xs hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100 dark:shadow-none"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingRecord ? 'Update Record' : 'Record Delivery')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
