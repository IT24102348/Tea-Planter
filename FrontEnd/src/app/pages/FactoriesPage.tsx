import { useState, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Building2, Plus, Loader2, Phone, User, Trash2, Edit2, ChevronRight, MapPin } from 'lucide-react';
import { api } from '@/lib/api';

interface Factory {
    id: number;
    name: string;
    registerNo: string;
    contactNumber: string;
    lorrySupervisorName: string;
    lorrySupervisorContact: string;
}

export function FactoriesPage() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const plantationId = user?.publicMetadata?.plantationId as string | undefined;

    const [factories, setFactories] = useState<Factory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedFactory, setSelectedFactory] = useState<Factory | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDetails, setShowDetails] = useState<Factory | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        registerNo: '',
        contactNumber: '',
        lorrySupervisorName: '',
        lorrySupervisorContact: ''
    });
    
    // Search and Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest'>('name');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const data = await api.getFactories(plantationId, token || undefined);
            setFactories(data);
        } catch (error) {
            console.error('Failed to fetch factories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredFactories = useMemo(() => {
        return factories.filter(f => {
            const searchLower = searchTerm.toLowerCase();
            return (f.name?.toLowerCase() || '').includes(searchLower) || 
                   (f.registerNo?.toLowerCase() || '').includes(searchLower) ||
                   (f.lorrySupervisorName?.toLowerCase() || '').includes(searchLower);
        }).sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'newest') return b.id - a.id;
            if (sortBy === 'oldest') return a.id - b.id;
            return 0;
        });
    }, [factories, searchTerm, sortBy]);

    const handleEdit = (factory: Factory) => {
        setSelectedFactory(factory);
        setFormData({
            name: factory.name,
            registerNo: factory.registerNo || '',
            contactNumber: factory.contactNumber || '',
            lorrySupervisorName: factory.lorrySupervisorName || '',
            lorrySupervisorContact: factory.lorrySupervisorContact || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this factory? This may affect linked delivery and income records.')) return;
        try {
            const token = await getToken();
            await api.deleteFactory(id, token || undefined);
            fetchData();
        } catch (error) {
            console.error('Failed to delete factory:', error);
            alert('Failed to delete factory.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData
            };

            const token = await getToken();
            if (selectedFactory) {
                await api.updateFactory(selectedFactory.id, data, token || undefined);
            } else {
                await api.createFactory(data, plantationId || '', token || undefined);
            }

            setShowModal(false);
            setSelectedFactory(null);
            setFormData({
                name: '',
                registerNo: '',
                contactNumber: '',
                lorrySupervisorName: '',
                lorrySupervisorContact: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to save factory:', error);
            alert('Failed to save factory.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter">Tea Factories</h1>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-70">
                        {searchTerm ? (
                            <span>Showing <b className="text-foreground">{filteredFactories.length}</b> of {factories.length} factories</span>
                        ) : (
                            'Manage partner factories and contact details'
                        )}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedFactory(null);
                        setFormData({
                            name: '',
                            registerNo: '',
                            contactNumber: '',
                            lorrySupervisorName: '',
                            lorrySupervisorContact: ''
                        });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors shadow-md shadow-blue-100 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Factory
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative flex-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="SEARCH BY FACTORY NAME OR REGISTRATION NO..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-sm tracking-tight placeholder:text-muted-foreground/50 placeholder:uppercase"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">Sort By:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black uppercase tracking-tight transition-all cursor-pointer"
                    >
                        <option value="name">Name (A-Z)</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-widest"
                    >
                        Clear Search
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFactories.map((factory) => (
                    <div
                        key={factory.id}
                        onClick={() => setShowDetails(factory)}
                        className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                    >
                        <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(factory);
                                        }}
                                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(factory.id);
                                        }}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-red-600 dark:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-black text-foreground text-lg uppercase tracking-tight">{factory.name}</h3>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Reg: {factory.registerNo || 'N/A'}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground font-black tracking-tight text-xs uppercase">
                                    <Phone className="w-4 h-4" />
                                    <span>{factory.contactNumber || 'No contact'}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {factories.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No factories registered yet.</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-border">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-50 dark:bg-blue-950/30">
                            <h2 className="text-xl font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter">
                                {selectedFactory ? 'Edit Factory' : 'Register Factory'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Factory Name *</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-tight text-sm"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Registration No</label>
                                    <input
                                        type="text"
                                        value={formData.registerNo}
                                        onChange={(e) => setFormData({ ...formData, registerNo: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-tight text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Factory Contact Number</label>
                                <input
                                    type="text"
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-tight text-sm"
                                />
                            </div>

                            <div className="pt-4 border-t border-border mt-4">
                                <h4 className="text-[10px] font-black tracking-[0.2em] text-foreground uppercase mb-4 flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    Lorry Supervisor Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Supervisor Name</label>
                                        <input
                                            type="text"
                                            value={formData.lorrySupervisorName}
                                            onChange={(e) => setFormData({ ...formData, lorrySupervisorName: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-tight text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Supervisor Contact</label>
                                        <input
                                            type="text"
                                            value={formData.lorrySupervisorContact}
                                            onChange={(e) => setFormData({ ...formData, lorrySupervisorContact: e.target.value })}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-tight text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-border mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-border text-foreground bg-card hover:bg-muted rounded-lg font-black uppercase tracking-widest text-[10px] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-100 dark:shadow-none"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedFactory ? 'Update' : 'Register')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetails && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50 backdrop-blur-md">
                    <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-border">
                        <div className="relative h-32 bg-blue-600 dark:bg-blue-900 overflow-hidden flex items-end p-6">
                            <button
                                onClick={() => setShowDetails(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm z-10"
                            >
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-16 h-16 bg-card rounded-xl shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl border border-border">
                                    <Building2 className="w-8 h-8" />
                                </div>
                                <div className="text-white">
                                    <h2 className="text-xl font-black uppercase tracking-tighter">{showDetails.name}</h2>
                                    <p className="text-blue-100 dark:text-blue-200 text-[10px] font-black uppercase tracking-widest opacity-90">#{showDetails.registerNo || 'No Reg ID'}</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-70">Contact Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400"><Phone className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-80 mb-0.5">Factory Hotline</p>
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{showDetails.contactNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400"><Building2 className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-80 mb-0.5">Registration Status</p>
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{showDetails.registerNo ? 'Registered' : 'Pending'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-70">Lorry Supervisor</h3>
                                <div className="p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mb-0.5">Supervisor Name</p>
                                            <p className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-tight">{showDetails.lorrySupervisorName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-green-700/70 dark:text-green-400/70 uppercase tracking-widest mb-0.5">Direct Contact</p>
                                            <p className="text-sm font-black text-green-900 dark:text-green-100 uppercase tracking-tight">{showDetails.lorrySupervisorContact || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowDetails(null)}
                                className="w-full py-3 bg-foreground hover:bg-muted-foreground text-background rounded-xl font-black uppercase tracking-widest border border-border mt-6 transition-all"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper icons
function Truck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.035-2.544A1 1 0 0 0 19 10.18V6a2 2 0 0 0-2-2h-3" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
        </svg>
    );
}
