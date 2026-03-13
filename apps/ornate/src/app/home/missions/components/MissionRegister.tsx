'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { registerForEvent } from '@/lib/actions/register-event';
import { createTeam, getTeamDetails } from '@/lib/actions/team';
import type { Mission } from '@/components/missions/MissionCard';

type Props = {
  mission: Mission;
  accent: string;
  registered: boolean;
  setRegistered: (v: boolean) => void;
  userProfile?: { id: string; name: string | null; stdid: string | null } | null;
};

export default function MissionRegister({ mission, accent, registered, setRegistered, userProfile }: Props) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState('');

  const minSize = mission.teamSizeMin || 1;
  const maxSize = mission.teamSizeMax || 1;

  const leaderProfile = useMemo(() => {
    if (userProfile) return userProfile;
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.name,
        stdid: (session.user as any).stdid || null
      };
    }
    return null;
  }, [userProfile, session]);

  const [teamMembers, setTeamMembers] = useState<{ name: string; id: string }[]>(() => {
    const initial = mission.isTeam ? Array.from({ length: minSize }, () => ({ name: '', id: '' })) : [];
    if (mission.isTeam && leaderProfile && initial.length > 0) {
      initial[0] = { name: leaderProfile.name || '', id: leaderProfile.stdid || leaderProfile.id };
    }
    return initial;
  });

  // Force sync leader data whenever leaderProfile is available
  useEffect(() => {
    if (mission.isTeam && leaderProfile && teamMembers.length > 0 && !registered) {
      const leaderData = { 
        name: leaderProfile.name || '', 
        id: leaderProfile.stdid || leaderProfile.id 
      };
      
      setTeamMembers(prev => {
        if (prev.length === 0) return prev;
        if (prev[0].name === leaderData.name && prev[0].id === leaderData.id) return prev;
        const next = [...prev];
        next[0] = leaderData;
        return next;
      });
    }
  }, [leaderProfile, mission.isTeam, registered]);

  // Fetch full team details if registered
  useEffect(() => {
    if (registered && mission.isTeam) {
      getTeamDetails(mission.id).then(res => {
        if (res.success && res.data) {
          setTeamMembers(res.data.members.map(m => ({ name: m.name, id: m.id })));
          setTeamName(res.data.teamName);
        }
      });
    }
  }, [registered, mission.isTeam, mission.id]);

  const addMember = () => {
    if (teamMembers.length < maxSize) {
      setTeamMembers(prev => [...prev, { name: '', id: '' }]);
    }
  };

  const removeMember = (index: number) => {
    if (teamMembers.length > minSize) {
      setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, field: 'name' | 'id', val: string) => {
    setTeamMembers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val.toUpperCase() };
      return next;
    });
  };

  const isTeamRefReady = !mission.isTeam || teamMembers.every(m => m.name && m.id);

  const handleRegister = async () => {
    if (!isTeamRefReady) return;
    setIsLoading(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        let res;
        if (mission.isTeam) {
          if (!teamName.trim()) {
            reject(new Error('Unit Designation (Team Name) required.'));
            setIsLoading(false);
            return;
          }
          res = await createTeam({
            eventId: mission.id,
            teamName: teamName.toUpperCase().trim(),
            members: teamMembers.slice(1).map(m => ({ studentName: m.name, studentId: m.id })),
          });
        } else {
          res = await registerForEvent({ eventId: mission.id });
        }

        if (res.success) {
          setRegistered(true);
          resolve(res);
        } else {
          reject(new Error(res.error || 'Registration failed'));
        }
      } catch (err) {
        reject(err);
      } finally {
        setIsLoading(false);
      }
    });

    toast.promise(promise, {
      loading: 'Synchronizing with Command Center...',
      success: 'Registration Authorized. Mission Log Updated.',
      error: (err) => err.message,
    });
  };

  return (
    <>
      {!mission.isTeam && userProfile && !registered && (
        <div className="p-4 bg-black/40 border border-neon/20 space-y-2" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-neon" />
            <h3 className="text-[9px] font-black tracking-[0.3em] text-neon uppercase">Confirm Operator Identity</h3>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white uppercase font-black tracking-widest">{userProfile.name}</span>
            <span className="text-[9px] text-gray-500 font-mono tracking-tighter">ID: {userProfile.stdid || userProfile.id}</span>
          </div>
          <p className="text-[8px] text-gray-600 tracking-widest uppercase mt-1">Direct registration using synchronized profile data</p>
        </div>
      )}

      {mission.isTeam && (
        <div className="space-y-4 pt-4 border-t border-white/5">
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black tracking-[0.3em] text-neon uppercase">
                  {mission.category === 'BRANCHES' ? 'DEPT. SQUAD MANIFEST' : 
                   mission.category === 'CLUBS' ? 'CLUB OPERATIVE LIST' : 
                   'MISSION DIRECTIVE ROSTER'}
                </h3>
                <div className="text-[9px] font-bold text-gray-500 uppercase">
                  {teamMembers.filter(m => m.name && m.id).length} / {teamMembers.length} IDENTIFIED
                </div>
              </div>

              <div className="p-3 bg-neon/5 border border-neon/20">
                <p className="text-[8px] tracking-[0.3em] font-black text-neon uppercase mb-1">Squad Designation (Team Name)</p>
                <input
                  value={teamName}
                  onChange={e => !registered && setTeamName(e.target.value.toUpperCase())}
                  readOnly={registered}
                  placeholder="ENTER SQUAD NAME"
                  className={`w-full bg-transparent border-b py-1 text-xs font-bold uppercase tracking-widest placeholder:text-white/20 focus:outline-none transition-colors ${registered ? 'border-neon/30 text-neon cursor-default' : 'border-white/10 focus:border-purple-500 text-white'}`}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="space-y-3">
                {teamMembers.map((m, idx) => (
                  <div key={idx} className={`flex flex-col gap-2 p-3 bg-black/40 border transition-colors ${m.name && m.id ? 'border-purple-500/40' : 'border-white/10 focus-within:border-purple-500/50'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className={`text-[8px] tracking-widest font-black uppercase ${idx === 0 ? 'text-neon' : 'text-gray-500'}`}>
                        {idx === 0 ? 'TEAM LEADER (YOU)' : `MEMBER ${idx + 1}`}
                      </p>
                      <div className="flex items-center gap-2">
                        {idx >= minSize && !registered && (
                          <button 
                            onClick={() => removeMember(idx)}
                            className="text-[8px] text-red-500/60 hover:text-red-500 font-black uppercase tracking-tighter"
                          >
                            [ DISMISS ]
                          </button>
                        )}
                        <span className="text-[9px] text-gray-700 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={m.name}
                        onChange={e => !registered && idx !== 0 && updateMember(idx, 'name', e.target.value)}
                        readOnly={registered || (idx === 0 && !!leaderProfile)}
                        placeholder="OPERATIVE NAME"
                        className={`flex-1 bg-transparent border-b py-1 text-xs font-bold uppercase tracking-wider placeholder:text-white/30 focus:outline-none transition-colors ${registered || (idx === 0 && !!leaderProfile) ? 'border-neon/30 text-neon cursor-default' : 'border-white/10 focus:border-purple-500 text-white'}`}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <input
                        value={m.id}
                        onChange={e => !registered && idx !== 0 && updateMember(idx, 'id', e.target.value)}
                        readOnly={registered || (idx === 0 && !!leaderProfile)}
                        placeholder="UID"
                        className={`w-24 bg-transparent border-b py-1 text-xs font-bold uppercase tracking-wider placeholder:text-white/30 focus:outline-none text-center transition-colors ${registered || (idx === 0 && !!leaderProfile) ? 'border-neon/30 text-neon cursor-default' : 'border-white/10 focus:border-purple-500 text-white'}`}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                ))}

                {teamMembers.length < maxSize && !registered && (
                  <button
                    onClick={addMember}
                    className="w-full py-2 border border-dashed border-white/10 text-[9px] font-black text-gray-500 hover:text-neon hover:border-neon/30 transition-all uppercase tracking-widest"
                  >
                    + Recruit Additional Operative
                  </button>
                )}
              </div>
            </>
        </div>
      )}

      <div className="px-7 py-5 border-t border-white/5 bg-black/50 shrink-0 relative z-10">
        <motion.button
          disabled={(!isTeamRefReady && !registered) || isLoading}
          whileHover={(isTeamRefReady && !isLoading) ? { scale: 1.02 } : {}}
          whileTap={(isTeamRefReady && !isLoading) ? { scale: 0.97 } : {}}
          onClick={registered ? undefined : handleRegister}
          className={`w-full py-4 font-black tracking-[0.4em] uppercase text-sm relative overflow-hidden transition-all duration-300 ${((!isTeamRefReady && !registered) || isLoading) ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          style={registered ? {
            background: 'transparent',
            border: `1px solid ${accent}60`,
            color: accent,
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
          } : {
            background: `linear-gradient(90deg, ${accent}ee, ${accent}cc)`,
            border: `1px solid ${accent}`,
            color: '#000',
            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
            boxShadow: `0 0 30px ${accent}55`,
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!registered && isTeamRefReady && !isLoading && (
            <div className="absolute inset-0 opacity-30"
              style={{ background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`, animation: 'shimmer 2s infinite' }} />
          )}
          {registered
            ? (mission.isTeam 
                ? (mission.category === 'BRANCHES' ? '✓ SQUAD DEPLOYED' : '✓ CREW DEPLOYED') 
                : '✓ REGISTERED')
            : (isLoading ? (mission.isTeam ? 'AUTHORIZING...' : 'INITIATING...') : (mission.isTeam ? 'AUTHORIZE DEPLOYMENT' : 'INITIATE REGISTRATION'))}
        </motion.button>
        <p className="text-center text-[8px] text-gray-700 tracking-widest uppercase mt-3">
          {registered
            ? (mission.isTeam ? `Unit successfully synchronized with command` : 'Mission entry authorized · Potential rewards pending verification')
            : (mission.isTeam ? `Composition: ${minSize}-${maxSize} Operatives Required` : 'Secure your slot before it fills up')}
        </p>
      </div>
    </>
  );
}
