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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  // Selection States
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [selectedBranch, setSelectedBranch] = useState('cse');
  const [selectedClub, setSelectedClub] = useState('techexcel');
  const [selectedSportsBranch, setSelectedSportsBranch] = useState('cse');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'super@admin.com',
      password: ''
    }
  });

  const emailValue = watch('email');

  const branches = [
    { id: 'cse', name: 'Computer Science' },
    { id: 'ece', name: 'Electronics & Comm.' },
    { id: 'eee', name: 'Electrical & Electronics' },
    { id: 'mech', name: 'Mechanical' },
    { id: 'civil', name: 'Civil Engineering' },
  ];

  const clubs = [
    { id: 'techexcel', name: 'TechXcel' },
    { id: 'sarvasrijana', name: 'Sarvasrijana' },
    { id: 'artix', name: 'Artix' },
    { id: 'kaladharani', name: 'Kaladharani' },
    { id: 'khelsaathi', name: 'KhelSaathi' },
    { id: 'icro', name: 'ICRO' },
    { id: 'pixelro', name: 'Pixelro' },
  ];

  // Auto-fill email based on Role selection
  useEffect(() => {
    let autoEmail = '';

    switch (selectedRole) {
      case 'super_admin':
        autoEmail = 'super@admin.com';
        break;
      case 'branch':
        autoEmail = `${selectedBranch}@admin.com`;
        break;
      case 'club':
        autoEmail = `${selectedClub}@clubs.com`;
        break;
      case 'sports':
        autoEmail = 'sports@admin.com';
        break;
      case 'branch_sports':
        autoEmail = `sports_${selectedSportsBranch}@admin.com`;
        break;
      case 'hho':
        autoEmail = 'hho@admin.com';
        break;
      case 'event_coordinator':
        autoEmail = '';
        break;
      default:
        autoEmail = '';
    }

    setValue('email', autoEmail);
  }, [selectedRole, selectedBranch, selectedClub, selectedSportsBranch, setValue]);

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        showToast("Invalid credentials. Please check your details.", "error");
        setIsLoading(false);
      } else {
        showToast("Login successful", "success");

        // Check for callbackUrl in search params
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get('callbackUrl');

        if (callbackUrl) {
          router.push(callbackUrl);
          return;
        }

        if (selectedRole === 'event_coordinator') {
          router.push('/coordinator');
          return;
        }

        if (selectedRole === 'club') {
          router.push('/clubs-portal');
          return;
        }

        if (selectedRole === 'super_admin') {
          router.push('/super-admin');
        } else if (selectedRole === 'sports' || selectedRole === 'branch_sports') {
          router.push('/sports');
        } else if (selectedRole === 'hho') {
          router.push('/hho');
        } else {
          router.push('/branch-admin');
        }
      }
    } catch (error) {
      showToast("Connection error", "error");
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

          <form onSubmit={handleSubmit(onLogin)} className="space-y-5">

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
                    <SelectItem value="branch">Branch Admin</SelectItem>
                    <SelectItem value="club">Club Coordinator</SelectItem>
                    <SelectItem value="sports">Sports Admin</SelectItem>
                    <SelectItem value="branch_sports">Branch Sports Admin</SelectItem>
                    <SelectItem value="hho">HHO</SelectItem>
                    <SelectItem value="event_coordinator">Event Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Selection (Conditional) */}
              {selectedRole === 'branch' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-[#1A1A1A]">Select Department</label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                      <SelectValue placeholder="Select Department" />
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

              {/* Branch Sports Admin Selection (Conditional) */}
              {selectedRole === 'branch_sports' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium text-[#1A1A1A]">Select Branch</label>
                  <Select value={selectedSportsBranch} onValueChange={setSelectedSportsBranch}>
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
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A1A1A]">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    {...register('email')}
                    type="email"
                    readOnly={selectedRole !== 'event_coordinator'}
                    className={`w-full pl-12 pr-4 py-3.5 border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none ${selectedRole !== 'event_coordinator' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white text-[#1A1A1A] focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]'}`}
                    placeholder={selectedRole === 'event_coordinator' ? "Enter your email" : "Auto-filled based on role"}
                  />
                </div>
                {errors.email?.message && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">Password</label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
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
                {errors.password?.message && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
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
