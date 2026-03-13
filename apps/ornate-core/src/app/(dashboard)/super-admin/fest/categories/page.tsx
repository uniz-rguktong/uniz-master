import { Plus, Tag, Trash2, Edit2 } from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';

const INITIAL_CATEGORIES = [
    { id: 1, name: 'Technical', color: '#4F46E5', count: 45, tags: ['Coding', 'Robotics', 'Paper Presentation'] },
    { id: 2, name: 'Cultural', color: '#E11D48', count: 32, tags: ['Dance', 'Music', 'Drama', 'Art'] },
    { id: 3, name: 'Sports', color: '#EA580C', count: 18, tags: ['Indoor', 'Outdoor', 'Athletics'] },
];

export default function CategoriesPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-[#1A1A1A]">Event Categories</h1>
                            <InfoTooltip text="Classify events for better organization and filtering" size="md" />
                        </div>
                        <p className="text-sm text-[#6B7280]">Manage event classifications and search tags.</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INITIAL_CATEGORIES.map((cat: any) => (
                    <div key={cat.id} className="bg-[#F4F2F0] rounded-[18px] p-[10px] group hover:-translate-y-1 transition-transform duration-300">
                        <div className="bg-white rounded-[14px] p-6 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md"
                                    style={{ backgroundColor: cat.color }}
                                >
                                    <Tag className="w-5 h-5" />
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                                    <button className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">{cat.name}</h3>
                            <p className="text-sm text-gray-500 mb-6">{cat.count} Events Assigned</p>

                            <div className="mt-auto">
                                <div className="flex flex-wrap gap-2">
                                    {cat.tags.map((tag: any, i: any) => (
                                        <span key={i} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                    <button className="px-2 py-1 border border-dashed border-gray-300 rounded text-xs text-gray-400 hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors">
                                        + Tag
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder */}
                <button className="border-2 border-dashed border-[#E5E7EB] rounded-[18px] p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-[#1A1A1A] hover:bg-gray-50 transition-all min-h-[300px]">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-gray-600" />
                    </div>
                    <span className="font-semibold text-gray-600">Create New Category</span>
                </button>
            </div>
        </div>
    );
}
