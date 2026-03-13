import { Save, AlertTriangle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function PointsManagementPage() {
    return (
        <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1A1A1A]">Points Calculation Logic</h1>
                        <p className="text-sm text-[#6B7280]">Configure scoring rules for various event categories.</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-lg shadow-gray-200">
                        <Save className="w-4 h-4" />
                        Save Rules
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Standard Events */}
                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6 space-y-4">
                        <h3 className="font-bold text-[#1A1A1A] border-b border-gray-100 pb-2">Technical & Cultural (Standard)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">1st Place</label>
                                <input type="number" defaultValue={10} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">2nd Place</label>
                                <input type="number" defaultValue={5} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">3rd Place</label>
                                <input type="number" defaultValue={3} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Participation</label>
                                <input type="number" defaultValue={1} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sports Events */}
                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6 space-y-4">
                        <h3 className="font-bold text-[#1A1A1A] border-b border-gray-100 pb-2">Sports (High Impact)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Winner</label>
                                <input type="number" defaultValue={50} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Runner Up</label>
                                <input type="number" defaultValue={30} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg mt-2">
                            Note: Team sports points are awarded per team, not per player.
                        </div>
                    </div>
                </div>

                {/* Multipliers */}
                <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                    <div className="bg-white rounded-[14px] p-6 space-y-4">
                        <h3 className="font-bold text-[#1A1A1A] border-b border-gray-100 pb-2">Bonus Multipliers</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Flagship Events (Hackathon)</span>
                            <Select defaultValue="1.5x">
                                <SelectTrigger className="w-[100px] px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                    <SelectValue placeholder="1.5x" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.5x">1.5x</SelectItem>
                                    <SelectItem value="2.0x">2.0x</SelectItem>
                                    <SelectItem value="3.0x">3.0x</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Early Bird Bonus</span>
                            <Select defaultValue="None">
                                <SelectTrigger className="w-[100px] px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    <SelectItem value="1.1x">1.1x</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl md:col-span-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">Modification of point values mid-event will trigger a full recalculation of the leaderboard. This action is logged and irreversible.</p>
                </div>
            </div>
        </div>
    );
}
