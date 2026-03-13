'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Selection States
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [selectedClub, setSelectedClub] = useState('techexcel');
  const [selectedBranch, setSelectedBranch] = useState('branch_cse');
  const [selectedHHO, setSelectedHHO] = useState('hho');
  const [selectedSports, setSelectedSports] = useState('sports_admin');
  const [isLoading, setIsLoading] = useState(false);

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const clubs = [
    { id: 'techexcel', name: 'TechXcel' },
    { id: 'sarva_srujana', name: 'Sarva Srujana' },
    { id: 'artix', name: 'Artix' },
    { id: 'kaladharani', name: 'Kaladharani' },
    { id: 'khelsaathi', name: 'Khelsaathi' },
    { id: 'icro', name: 'ICRO' },
    { id: 'pixelro', name: 'PixelRo' },
  ];

  const branches = [
    { id: 'branch_cse', name: 'CSE Branch' },
    { id: 'branch_ece', name: 'ECE Branch' },
    { id: 'branch_eee', name: 'EEE Branch' },
    { id: 'branch_mech', name: 'MECH Branch' },
    { id: 'branch_civil', name: 'CIVIL Branch' },
  ];

  const hhoEntities = [
    { id: 'hho', name: 'HHO Center' },
  ];

  const sportsEntities = [
    { id: 'sports_admin', name: 'Sports Admin' },
  ];

  // Auto-fill email based on Role selection
  useEffect(() => {
    let autoEmail = '';

    switch (selectedRole) {
      case 'super_admin':
        autoEmail = 'super@admin.com';
        break;
      case 'club':
        autoEmail = `${selectedClub}@clubs.com`;
        break;
      case 'branch':
        autoEmail = `${selectedBranch.replace('branch_', '')}@branch.com`;
        break;
      case 'hho':
        autoEmail = 'hho@center.com';
        break;
      case 'sports':
        autoEmail = 'sports@admin.com';
        break;
      default:
        autoEmail = '';
    }

    setEmail(autoEmail);
  }, [selectedRole, selectedClub, selectedBranch]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app this would call next-auth signIn
      // For now we simulate logic to "mock" the user object that would be returned
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        showToast("Invalid credentials - Please check your password", "error");
        setIsLoading(false);
      } else {
        showToast("Access Granted - Redirecting to Dashboard", "success");
        router.refresh();
        router.push('/dashboard');
      }
    } catch (error) {
      showToast("Connection Failiure", "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F6F6] font-[sans-serif] p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-[#10B981]/5 to-transparent pointer-events-none" />

      {/* Auth Form */}
      <div className="w-full max-w-md relative z-10">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100">

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-[#6B7280]">
              Select your role to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role Selection */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Select Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="club">Club Coordinator</SelectItem>
                    <SelectItem value="branch">Branch Admin</SelectItem>
                    <SelectItem value="hho">HHO</SelectItem>
                    <SelectItem value="sports">Sports Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Club Selection (Conditional) */}
              {selectedRole === 'club' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-[#1A1A1A]">Select Club</label>
                  <Select value={selectedClub} onValueChange={setSelectedClub}>
                    <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                      <SelectValue placeholder="Select Club" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Branch Selection (Conditional) */}
              {selectedRole === 'branch' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-[#1A1A1A]">Select Branch</label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* HHO Selection (Conditional) */}
              {selectedRole === 'hho' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-[#1A1A1A]">Select HHO Entity</label>
                  <Select value={selectedHHO} onValueChange={setSelectedHHO}>
                    <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                      <SelectValue placeholder="Select HHO" />
                    </SelectTrigger>
                    <SelectContent>
                      {hhoEntities.map(h => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sports Selection (Conditional) */}
              {selectedRole === 'sports' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-[#1A1A1A]">Select Sports Entity</label>
                  <Select value={selectedSports} onValueChange={setSelectedSports}>
                    <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                      <SelectValue placeholder="Select Entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportsEntities.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A1A1A]">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="email"
                    required
                    readOnly // Make email read-only since it is auto-filled
                    value={email}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 text-gray-500 border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none cursor-not-allowed"
                    placeholder="Auto-filled based on role"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">Password</label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all placeholder:text-gray-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#10B981] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[#059669] hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Verifying...</>
              ) : (
                <>
                  Login to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
