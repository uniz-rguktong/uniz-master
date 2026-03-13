'use client';

import { useState, useEffect } from 'react';
import { Upload, Video, Image as ImageIcon, Play, Eye, Share2, CheckCircle, Trash2, X, Link, Save, Palette, Layers, Globe, ChevronRight, Zap, ArrowUpRight, ShieldCheck, Terminal, Sparkles } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { VideoCard } from '@/components/VideoCard';
import { LogoCard } from '@/components/LogoCard';
import { Modal } from '@/components/Modal';
import { MetricCard } from '@/components/MetricCard';
import { Skeleton, MetricCardSkeleton, VideoCardSkeleton, LogoCardSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import {
    getPromoVideos,
    createPromoVideo,
    updatePromoVideo,
    deletePromoVideo,
    getBrandLogos,
    createBrandLogo,
    updateBrandLogo,
    deleteBrandLogo
} from '@/actions/brandActions';
import { uploadFileToR2 } from '@/lib/upload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

const videoSchema = z.object({
    title: z.string().min(2, 'Title is required'),
    url: z.string().url('Valid URL is required').or(z.string().min(1, 'URL or file is required')),
    platform: z.enum(['YouTube', 'Vimeo', 'Direct Upload']),
    status: z.enum(['active', 'inactive'])
});

const logoSchema = z.object({
    name: z.string().min(2, 'Logo name is required'),
    type: z.string().min(1, 'Type is required'),
    format: z.string().min(1, 'Format is required'),
    status: z.enum(['active', 'inactive']),
    url: z.string().optional()
});

export function BrandingPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('logos');
    const [isLoading, setIsLoading] = useState(true);
    const [promoVideos, setPromoVideos] = useState<any[]>([]);
    const [logos, setLogos] = useState<any[]>([]);

    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showLogoModal, setShowLogoModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const videoForm = useForm<z.infer<typeof videoSchema>>({
        resolver: zodResolver(videoSchema),
        defaultValues: { title: '', url: '', platform: 'YouTube', status: 'active' }
    });

    const logoForm = useForm<z.infer<typeof logoSchema>>({
        resolver: zodResolver(logoSchema),
        defaultValues: { name: '', type: 'Primary Logo', format: 'SVG', status: 'active' }
    });

    useEffect(() => {
        const savedTab = localStorage.getItem('hho_branding_active_tab');
        if (savedTab) setActiveTab(savedTab);
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [videosRes, logosRes] = await Promise.all([getPromoVideos(), getBrandLogos()]);
            if (videosRes.success) setPromoVideos(videosRes.videos || []);
            if (logosRes.success) setLogos(logosRes.logos || []);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        localStorage.setItem('hho_branding_active_tab', tab);
    };

    const onVideoSubmit = async (data: z.infer<typeof videoSchema>) => {
        try {
            const videoData = {
                ...data,
                thumbnail: getThumbnailUrl(data) || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
                duration: '0:00'
            };

            const result = editingItem
                ? await updatePromoVideo(editingItem.id, videoData)
                : await createPromoVideo(videoData);

            if (result.success) {
                showToast(`Asset synchronization successful.`, 'success');
                fetchData();
                setShowVideoModal(false);
                setEditingItem(null);
                videoForm.reset();
            } else {
                showToast(result.error || 'Operation failed', 'error');
            }
        } catch (e) {
            showToast('Cloud uplink failed', 'error');
        }
    };

    const onLogoSubmit = async (data: z.infer<typeof logoSchema>) => {
        try {
            let finalUrl = editingItem?.url || '';
            if (logoFile) {
                const uploadedUrl = await uploadFileToR2(logoFile);
                if (!uploadedUrl) throw new Error('Upload failed');
                finalUrl = uploadedUrl;
            }

            const logoData = {
                ...data,
                url: finalUrl,
                thumbnail: finalUrl,
                size: logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : (editingItem?.size || 'N/A'),
                dimensions: editingItem?.dimensions || 'N/A'
            };

            const result = editingItem
                ? await updateBrandLogo(editingItem.id, logoData)
                : await createBrandLogo(logoData);

            if (result.success) {
                showToast(`Visual DNA updated in repository.`, 'success');
                fetchData();
                setShowLogoModal(false);
                setEditingItem(null);
                setLogoFile(null);
                setLogoPreview(null);
                logoForm.reset();
            } else {
                showToast(result.error || 'Operation failed', 'error');
            }
        } catch (e) {
            showToast('Cloud storage link failed', 'error');
        }
    };

    const handleVideoEdit = (video: any) => {
        setEditingItem(video);
        videoForm.reset({ title: video.title, url: video.url, platform: video.platform, status: video.status });
        setShowVideoModal(true);
    };

    const handleLogoEdit = (logo: any) => {
        setEditingItem(logo);
        logoForm.reset({ name: logo.name, type: logo.type, format: logo.format, status: logo.status });
        setLogoPreview(logo.url);
        setShowLogoModal(true);
    };

    const handleDelete = async (id: string, type: 'video' | 'logo') => {
        if (!confirm(`Confirm permanent decommission of ${type}?`)) return;
        const result = type === 'video' ? await deletePromoVideo(id) : await deleteBrandLogo(id);
        if (result.success) {
            showToast(`Asset purged from system.`, 'success');
            fetchData();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const getThumbnailUrl = (video: any) => {
        if (!video.url) return null;
        if (video.platform === 'YouTube') {
            const match = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
            return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg` : null;
        }
        return video.thumbnail;
    };

    return (
        <div className="p-8 md:p-12 animate-page-entrance min-h-screen bg-gray-50/20">
            {/* Intel Header */}
            <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        Visual Core <ChevronRight className="w-3 h-3" /> Brand Intelligence
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-emerald-600 rounded-[30px] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Palette className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">Branding <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">Engine</span></h1>
                            <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">Managing the collective visual DNA of the event ecosystem</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center p-2 bg-white rounded-[28px] border border-gray-100 shadow-sm gap-2">
                    <button
                        onClick={() => handleTabChange('logos')}
                        className={`flex items-center gap-2 px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'logos' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900'}`}>
                        <ShieldCheck className="w-4 h-4" /> Symbols
                    </button>
                    <button
                        onClick={() => handleTabChange('videos')}
                        className={`flex items-center gap-2 px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${activeTab === 'videos' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900'}`}>
                        <Play className="w-4 h-4" /> Motion
                    </button>
                </div>
            </div>

            {/* Tactical Metrics */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {isLoading ? Array(4).fill(0).map((_, i) => <MetricCardSkeleton key={i} />) : (
                    activeTab === 'logos' ? (
                        <>
                            <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Layers className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Master Library</p>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{logos.length} <span className="text-xs text-gray-400 font-bold">Files</span></h2>
                            </div>
                            <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Globe className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Vector Nodes</p>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{logos.filter(l => l.format === 'SVG').length} <span className="text-xs text-indigo-500 font-bold">SVG</span></h2>
                            </div>
                            <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><CheckCircle className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Live Status</p>
                                <h2 className="text-4xl font-black text-emerald-500 tracking-tighter">{logos.filter(l => l.status === 'active').length} <span className="text-xs text-gray-400 font-bold">Active</span></h2>
                            </div>
                            <div className="p-8 bg-gray-900 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-20"><Zap className="w-20 h-20 text-emerald-400" /></div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Cloud Sync</p>
                                <h2 className="text-4xl font-black text-white tracking-tighter">Optimal</h2>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Play className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Cinematic Core</p>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{promoVideos.length} <span className="text-xs text-gray-400 font-bold">Reels</span></h2>
                            </div>
                            <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Eye className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Global Reach</p>
                                <h2 className="text-4xl font-black text-indigo-600 tracking-tighter">{promoVideos.reduce((sum, v) => sum + (v.views || 0), 0)} <span className="text-xs text-gray-400 font-bold">Imp</span></h2>
                            </div>
                            <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Video className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Active Channels</p>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{promoVideos.filter(v => v.status === 'active').length} <span className="text-xs text-gray-400 font-bold">Live</span></h2>
                            </div>
                            <div className="p-8 bg-gray-900 rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-20"><Link className="w-20 h-20 text-indigo-400" /></div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Relay Status</p>
                                <h2 className="text-4xl font-black text-white tracking-tighter">Stream Ready</h2>
                            </div>
                        </>
                    )
                )}
            </div>

            <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Deployment Command Center</span>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        if (activeTab === 'videos') { videoForm.reset(); setShowVideoModal(true); }
                        else { logoForm.reset(); setLogoPreview(null); setShowLogoModal(true); }
                    }}
                    className="group px-10 py-5 bg-gray-900 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-black transition-all flex items-center gap-4 active:scale-95">
                    Register New Asset
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </button>
            </div>

            {/* Grid Container */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-[#F4F2F0] rounded-[64px] p-2 shadow-sm">
                    <div className="bg-white rounded-[56px] p-12 border border-white shadow-xl min-h-[600px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => activeTab === 'logos' ? <LogoCardSkeleton key={i} /> : <VideoCardSkeleton key={i} />)
                            ) : activeTab === 'logos' ? (
                                logos.length > 0 ? logos.map(logo => (
                                    <LogoCard
                                        key={logo.id}
                                        logo={logo}
                                        onEdit={() => handleLogoEdit(logo)}
                                        onDelete={() => handleDelete(logo.id, 'logo')}
                                        onDownload={() => window.open(logo.url, '_blank')}
                                    />
                                )) : (
                                    <div className="col-span-full py-40 border-2 border-dashed border-gray-100 rounded-[56px] flex flex-col items-center justify-center text-gray-300">
                                        <Sparkles className="w-16 h-16 mb-6 opacity-10" />
                                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Library Null</h4>
                                        <p className="text-[10px] font-bold mt-2 uppercase tracking-tighter text-gray-400">Deploy your first visual symbol to the cluster</p>
                                    </div>
                                )
                            ) : (
                                promoVideos.length > 0 ? promoVideos.map(video => (
                                    <VideoCard
                                        key={video.id}
                                        video={video}
                                        onEdit={() => handleVideoEdit(video)}
                                        onDelete={() => handleDelete(video.id, 'video')}
                                        onPreview={() => window.open(video.url, '_blank')}
                                    />
                                )) : (
                                    <div className="col-span-full py-40 border-2 border-dashed border-gray-100 rounded-[56px] flex flex-col items-center justify-center text-gray-300">
                                        <Play className="w-16 h-16 mb-6 opacity-10" />
                                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Reel Data Null</h4>
                                        <p className="text-[10px] font-bold mt-2 uppercase tracking-tighter text-gray-400">No cinematic signals detected in this sector</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Orchestration Modals */}
            <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} title={editingItem ? "Refine Reel Frequency" : "Deploy Cinematic Signals"}>
                <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-8 py-4">
                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Identity</label>
                                <Input {...videoForm.register('title')} placeholder="e.g. Ornate 2k26 Alpha Trailer" className="h-14 font-bold" error={videoForm.formState.errors.title?.message} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Frequency Source (URL)</label>
                                <Input {...videoForm.register('url')} placeholder="YouTube / Vimeo Source" className="h-14 font-bold text-xs" error={videoForm.formState.errors.url?.message} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Relay Engine</label>
                                    <div className="relative">
                                        <select {...videoForm.register('platform')} className="w-full h-14 px-6 rounded-2xl border-none bg-white shadow-inner text-xs font-black uppercase tracking-widest outline-none appearance-none">
                                            <option value="YouTube">YouTube Core</option>
                                            <option value="Vimeo">Vimeo Core</option>
                                            <option value="Direct Upload">CDN Direct</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational State</label>
                                    <select {...videoForm.register('status')} className="w-full h-14 px-6 rounded-2xl border-none bg-white shadow-inner text-xs font-black uppercase tracking-widest outline-none appearance-none">
                                        <option value="active">Operational</option>
                                        <option value="inactive">Standby</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setShowVideoModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-gray-600 transition-colors">Abort Op</button>
                        <button type="submit" disabled={videoForm.formState.isSubmitting} className="flex-[2] py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            {videoForm.formState.isSubmitting ? 'Syncing...' : (editingItem ? 'Authorize Update' : 'Initialize Asset')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} title={editingItem ? "Refine Visual DNA" : "Deploy Symbolic Intel"}>
                <form onSubmit={logoForm.handleSubmit(onLogoSubmit)} className="space-y-8 py-4">
                    <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100 flex flex-col items-center gap-8">
                        <div className="relative group">
                            <div className="w-40 h-40 bg-white rounded-[48px] shadow-inner border shadow-gray-100 border-white flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 duration-500">
                                {logoPreview ? <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4" /> : <ImageIcon className="w-12 h-12 text-gray-100" />}
                            </div>
                            <input type="file" id="logo-entry" className="hidden" accept="image/*" onChange={handleFileSelect} />
                            <label htmlFor="logo-entry" className="absolute inset-0 cursor-pointer rounded-[48px]" />
                        </div>
                        <div className="text-center space-y-2">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{logoPreview ? 'Asset Detected' : 'No Signal'}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Click to synchronize visual packet</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Symbol Call-Sign</label>
                                <Input {...logoForm.register('name')} placeholder="e.g. Master Cluster Mark" className="h-14 font-bold" error={logoForm.formState.errors.name?.message} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logic Class</label>
                                    <select {...logoForm.register('type')} className="w-full h-14 px-6 rounded-2xl border-none bg-white shadow-inner text-xs font-black uppercase tracking-widest outline-none appearance-none">
                                        <option value="Primary Logo">Primary Node</option>
                                        <option value="Secondary Logo">Secondary Relay</option>
                                        <option value="Stamp">Micro-Mark</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Encoding</label>
                                    <select {...logoForm.register('format')} className="w-full h-14 px-6 rounded-2xl border-none bg-white shadow-inner text-xs font-black uppercase tracking-widest outline-none appearance-none">
                                        <option value="SVG">Vector (SVG)</option>
                                        <option value="PNG">Raster (PNG)</option>
                                        <option value="JPG">Static (JPG)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button type="button" onClick={() => setShowLogoModal(false)} className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-gray-600 transition-colors">Abort Op</button>
                        <button type="submit" disabled={logoForm.formState.isSubmitting} className="flex-[2] py-5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            {logoForm.formState.isSubmitting ? 'Syncing...' : (editingItem ? 'Authorize Save' : 'Register Asset')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
