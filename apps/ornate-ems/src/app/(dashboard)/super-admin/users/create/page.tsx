'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAdminUser } from '@/actions/superAdminActions';
import { useToast } from '@/hooks/useToast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const ROLE_OPTIONS = [
    'Branch Admin',
    'Clubs',
    'Sports',
    'HHO',
    'Event Coordinator'
];

const BRANCH_OPTIONS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];

export default function CreateUserPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Branch Admin',
        branch: '',
        clubId: ''
    });

    const onFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Manual Validations
        if (!formData.name.trim()) {
            showToast('Full name is required', 'error');
            return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        if (formData.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        if (!formData.role) {
            showToast('Role is required', 'error');
            return;
        }
        if ((formData.role === 'Branch Admin' || formData.role === 'Sports') && !formData.branch) {
            showToast('Branch is required for the selected role', 'error');
            return;
        }
        if (formData.role === 'Clubs' && !formData.clubId.trim()) {
            showToast('Club ID is required for the Clubs role', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const payload: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
            };

            if (formData.branch) payload.branch = formData.branch;
            if (formData.clubId) payload.clubId = formData.clubId.trim();

            const result = await createAdminUser(payload);

            if ('error' in result && result.error) {
                showToast(result.error, 'error');
                return;
            }

            showToast('User created successfully', 'success');
            router.push('/super-admin/users');
            router.refresh();
        } catch (error) {
            showToast('Failed to create user', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[900px] mx-auto">
            <div className="flex items-start justify-between mb-8 gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-[#1A1A1A]">Add User</h1>
                    <p className="text-sm text-[#6B7280]">Create a new admin/coordinator user account.</p>
                </div>
                <Link
                    href="/super-admin/users"
                    className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs sm:text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors shrink-0 mt-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Users</span>
                    <span className="sm:hidden">Back</span>
                </Link>
            </div>

            <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
                <div className="bg-white rounded-[14px] p-6 md:p-8 border border-[#E5E7EB]">
                    <form onSubmit={onFormSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@example.com"
                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Role *</label>
                                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                    <SelectTrigger className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((role) => (
                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {(formData.role === 'Branch Admin' || formData.role === 'Sports') && (
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Branch *</label>
                                <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                                    <SelectTrigger className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BRANCH_OPTIONS.map((branch) => (
                                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {formData.role === 'Clubs' && (
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Club ID *</label>
                                <input
                                    type="text"
                                    value={formData.clubId}
                                    onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                                    placeholder="Enter club id"
                                    className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                                />
                            </div>
                        )}

                        <div className="pt-6 flex flex-row items-center gap-3 w-full">
                            <Link
                                href="/super-admin/users"
                                className="flex-1 px-6 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 text-center transition-all sm:flex-none sm:min-w-[120px]"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] disabled:opacity-60 transition-all sm:flex-none sm:min-w-[140px]"
                            >
                                {isLoading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
