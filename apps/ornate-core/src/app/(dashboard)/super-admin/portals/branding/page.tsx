'use client';
import { Upload, Image as ImageIcon, Trash2, Edit2, Download } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const PORTAL_ASSETS = [
    {
        id: 'cse',
        name: 'CSE Dept',
        logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=200&fit=crop',
        colors: ['#4F46E5', '#10B981']
    },
    {
        id: 'ece',
        name: 'ECE Dept',
        logo: 'https://images.unsplash.com/photo-1563694983011-6f4d90358083?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=200&fit=crop',
        colors: ['#EA580C', '#06B6D4']
    },
];

export default function BrandingPage() {
    const [selectedPortal, setSelectedPortal] = useState('cse');

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
             <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Branding & Assets</h1>
                        <p className="text-sm text-[#6B7280]">Manage logos, banners, and color themes for each portal.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Scanner */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider px-2">Select Portal</h3>
                    {['Computer Science (CSE)', 'Electronics (ECE)', 'Mechanical (MECH)', 'Civil Engineering', 'Sports Division', 'HHO Charity'].map((p: any, i: any) => (
                        <button 
                            key={i}
                            onClick={() => setSelectedPortal(p.includes('CSE') ? 'cse' : 'ece')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors
                                ${selectedPortal === (p.includes('CSE') ? 'cse' : 'ece') 
                                    ? 'bg-[#1A1A1A] text-white shadow-md' 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    {PORTAL_ASSETS.filter(a => a.id === selectedPortal).map((brand: any) => (
                        <div key={brand.id} className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                             {/* Colors Section */}
                            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                                <div className="bg-white rounded-[14px] p-6">
                                    <h3 className="font-bold text-[#1A1A1A] mb-4">Brand Colors</h3>
                                    <div className="flex gap-4">
                                        {brand.colors.map((c: any, i: any) => (
                                            <div key={i} className="group relative w-16 h-16 rounded-2xl cursor-pointer shadow-sm ring-1 ring-gray-100" style={{backgroundColor: c}}>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="bg-black/75 text-white text-[10px] px-2 py-1 rounded">{c}</span>
                                                </div>
                                            </div>
                                        ))}
                                         <button className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#1A1A1A] hover:bg-gray-50 transition-colors">
                                            <Edit2 className="w-5 h-5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Logo Section */}
                             <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                                <div className="bg-white rounded-[14px] p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-[#1A1A1A]">Official Logo</h3>
                                        <button className="text-sm text-indigo-600 font-medium hover:underline">Update Logo</button>
                                    </div>
                                    <div className="w-32 h-32 relative rounded-full border border-gray-100 p-2 mx-auto sm:mx-0">
                                        <Image 
                                            src={brand.logo} 
                                            alt="Logo" 
                                            fill 
                                            className="object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Banner Section */}
                             <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                                <div className="bg-white rounded-[14px] p-6">
                                     <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-[#1A1A1A]">Hero Banner</h3>
                                         <div className="flex gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Upload className="w-4 h-4" /></button>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Download className="w-4 h-4" /></button>
                                         </div>
                                    </div>
                                    <div className="w-full h-48 relative rounded-xl overflow-hidden group">
                                         <Image 
                                            src={brand.banner} 
                                            alt="Banner" 
                                            fill 
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-transform">Change Banner</button>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
