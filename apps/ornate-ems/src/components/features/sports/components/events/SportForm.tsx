'use client';
import { useMemo, useState, useEffect } from 'react';
import { getSportById } from '@/actions/sportGetters';
import { SportSetupStep } from './steps/SportSetupStep';
import { RegistrationRulesStep } from './steps/RegistrationRulesStep';
import { PointsAwardsStep } from './steps/PointsAwardsStep';
import { BracketsFixturesStep } from './steps/BracketsFixturesStep';
import { MediaAssetsStep } from './steps/MediaAssetsStep';
import { ReviewLaunchStep } from './steps/ReviewLaunchStep';
import { useToast } from '@/hooks/useToast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createSport, updateSport } from '@/actions/sportActions';

const baseSteps = [
    { id: 1, name: 'Sports Setup', component: SportSetupStep },
    { id: 2, name: 'Registration Rules', component: RegistrationRulesStep },
    { id: 3, name: 'Points & Awards', component: PointsAwardsStep },
    { id: 4, name: 'Brackets & Fixtures', component: BracketsFixturesStep },
    { id: 5, name: 'Media Assets', component: MediaAssetsStep },
    { id: 6, name: 'Review & Launch', component: ReviewLaunchStep }
];

interface SportFormProps {
    mode?: string | undefined;
    initialData?: any | undefined;
    onSuccess?: (() => void) | undefined;
    onCancel?: (() => void) | undefined;
    onNavigate?: ((path: string, options?: Record<string, unknown>) => void) | undefined;
    hideStep2Coordinators?: boolean | undefined;
    hiddenStepIds?: number[] | undefined;
}

export function SportForm({ mode = 'create', initialData, onSuccess, onCancel, onNavigate, hideStep2Coordinators = false, hiddenStepIds = [] }: SportFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const { showToast } = useToast();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = useMemo(
        () => baseSteps.filter((step) => !hiddenStepIds.includes(step.id)),
        [hiddenStepIds]
    );

    const toUiCompetitionCategory = (value: string | undefined | null) => {
        const normalized = (value || '').toUpperCase();
        if (normalized === 'TEAM') return 'Team';
        if (normalized === 'INDIVIDUAL') return 'Individual';
        return value || 'Team';
    };

    // Transform initialData to match form fields
    const getInitialState = () => {
        if (!initialData) {
            return {
                sportName: 'Cricket',
                sportCategory: 'Cricket',
                athleticsType: '',
                category: 'Team',
                genderType: 'MALE',
                format: 'KNOCKOUT',
                notes: '',
                bannerUrl: '',
                winnerPoints: 10,
                runnerupPoints: 5,
                participationPoints: 0,
            };
        }

        return {
            ...initialData,
            sportName: initialData.name || initialData.title || '',
            sportCategory: initialData.sportCategory || initialData.customFields?.sportCategory || 'Cricket',
            athleticsType: initialData.athleticsType || '',
            category: toUiCompetitionCategory(initialData.category),
            genderType: initialData.gender || initialData.type || 'MALE',
            format: initialData.format || 'KNOCKOUT',
            notes: initialData.description || initialData.notes || '',
            bannerUrl: initialData.bannerUrl || initialData.poster || initialData.posterUrl || '',
        };
    };

    const [sportData, setSportData] = useState<any>(getInitialState());

    useEffect(() => {
        if (mode === 'edit' && initialData?.id) {
            const fetchFullDetails = async () => {
                const res = await getSportById(initialData.id);
                if (res.success && (res as any).data) {
                    const fullEvent = (res as any).data;

                    setSportData((prev: any) => ({
                        ...prev,
                        ...fullEvent,
                        sportName: fullEvent.name || fullEvent.title,
                        sportCategory: fullEvent.sportCategory || fullEvent.customFields?.sportCategory || prev.sportCategory || 'Cricket',
                        athleticsType: fullEvent.athleticsType || fullEvent.customFields?.athleticsType || '',
                        category: toUiCompetitionCategory(fullEvent.category),
                        genderType: (() => {
                            // mapSportGender returns 'Boys'/'Girls'/'Mixed' but form needs 'MALE'/'FEMALE'/'MIXED'
                            const g = fullEvent.gender || fullEvent.customFields?.genderType || fullEvent.customFields?.type || 'MALE';
                            if (g === 'Boys' || g === 'MALE') return 'MALE';
                            if (g === 'Girls' || g === 'FEMALE') return 'FEMALE';
                            if (g === 'Mixed' || g === 'MIXED') return 'MIXED';
                            return g;
                        })(),
                        format: fullEvent.format || 'KNOCKOUT',
                        notes: fullEvent.description || '',
                        rules: fullEvent.rules || '',
                        maxTeamsPerBranch: fullEvent.maxTeamsPerBranch ?? fullEvent.maxCapacity ?? null,
                        minPlayers: fullEvent.minPlayersPerTeam ?? null,
                        maxPlayers: fullEvent.maxPlayersPerTeam ?? null,
                        matchDuration: fullEvent.matchDuration ?? null,
                        icon: fullEvent.icon || '',
                        deadline: fullEvent.registrationDeadline
                            ? new Date(fullEvent.registrationDeadline).toISOString().slice(0, 16)
                            : '',
                        winnerPoints: fullEvent.winnerPoints ?? fullEvent.customFields?.winnerPoints ?? 0,
                        runnerupPoints: fullEvent.runnerUpPoints ?? fullEvent.customFields?.runnerupPoints ?? 0,
                        participationPoints: fullEvent.participationPoints ?? fullEvent.customFields?.participationPoints ?? 0,
                        awards: fullEvent.awards || fullEvent.customFields?.awards || ['Certificate of Excellence', 'Medal'],
                        eligibility: fullEvent.eligibility || fullEvent.customFields?.eligibility || [],
                        bannerUrl: fullEvent.bannerUrl || fullEvent.posterUrl || '',
                    }));
                }
            };
            fetchFullDetails();
        } else {
            setSportData(getInitialState());
        }
    }, [mode, initialData]);

    useEffect(() => {
        if (currentStep > steps.length) {
            setCurrentStep(steps.length || 1);
        }
    }, [currentStep, steps.length]);

    const CurrentStepComponent = steps[currentStep - 1]?.component as any;

    const nextStep = () => {
        if (currentStep === 1) {
            if (!sportData.sportCategory || !sportData.category || !sportData.genderType || !sportData.format) {
                showToast('Please fill in required fields', 'error');
                return;
            }
            if (sportData.sportCategory === 'Athletics' && !sportData.athleticsType) {
                showToast('Please fill in required fields', 'error');
                return;
            }
        }

        if (currentStep === 2) {
            const hasDeadline = Boolean(String(sportData.deadline || sportData.registrationDeadline || '').trim());
            if (!hasDeadline) {
                showToast('Registration deadline is required', 'error');
                return;
            }
        }

        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const previousStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const submitForm = async (targetStatus: string) => {
        setIsSubmitting(true);
        setShowConfirm(false);
        try {
            const resolvedSportName =
                (sportData.sportName || '').trim() ||
                (sportData.sportCategory === 'Athletics' && sportData.athleticsType
                    ? `${sportData.sportCategory} - ${sportData.athleticsType}`
                    : (sportData.sportCategory || 'Sport'));

            const isTeamCategory = sportData.category === 'Team';
            const resolvedWinnerPoints = isTeamCategory ? 10 : 5;
            const resolvedRunnerupPoints = isTeamCategory ? 5 : 3;
            const resolvedSecondRunnerPoints = isTeamCategory ? 0 : 1;

            const formData = new FormData();
            formData.append('name', resolvedSportName);
            formData.append('category', sportData.category);
            formData.append('gender', sportData.genderType || 'MALE');
            formData.append('format', sportData.format || sportData.tournamentType || 'KNOCKOUT');
            if (sportData.notes) formData.append('description', sportData.notes);
            if (sportData.sportCategory) formData.append('sportCategory', sportData.sportCategory);
            if (sportData.athleticsType) formData.append('athleticsType', sportData.athleticsType);
            if (sportData.deadline) formData.append('registrationDeadline', sportData.deadline);
            if (sportData.rules) formData.append('rules', sportData.rules);
            if (sportData.matchDuration) formData.append('matchDuration', String(sportData.matchDuration));
            if (sportData.maxTeamsPerBranch) formData.append('maxTeamsPerBranch', String(sportData.maxTeamsPerBranch));
            if (sportData.minPlayers) formData.append('minPlayersPerTeam', String(sportData.minPlayers));
            if (sportData.maxPlayers) formData.append('maxPlayersPerTeam', String(sportData.maxPlayers));
            if (Array.isArray(sportData.eligibility)) formData.append('eligibility', JSON.stringify(sportData.eligibility));
            if (Array.isArray(sportData.awards)) formData.append('awards', JSON.stringify(sportData.awards));
            if (sportData.icon) formData.append('icon', sportData.icon);
            if (sportData.bannerUrl) {
                formData.append('bannerUrl', String(sportData.bannerUrl));
                formData.append('posterUrl', String(sportData.bannerUrl));
            } else if (sportData.poster) {
                formData.append('bannerUrl', String(sportData.poster));
                formData.append('posterUrl', String(sportData.poster));
            }

            const customFields = {
                genderType: sportData.genderType,
                sportCategory: sportData.sportCategory,
                athleticsType: sportData.athleticsType,
                winnerPoints: resolvedWinnerPoints,
                runnerupPoints: resolvedRunnerupPoints,
                participationPoints: resolvedSecondRunnerPoints,
                awards: sportData.awards,
                type: sportData.genderType // for compatibility
            };

            formData.append('customFields', JSON.stringify(customFields));
            formData.append('status', targetStatus);
            formData.append('winnerPoints', String(resolvedWinnerPoints));
            formData.append('runnerUpPoints', String(resolvedRunnerupPoints));
            formData.append('participationPoints', String(resolvedSecondRunnerPoints));

            let result;
            if (mode === 'edit' && initialData?.id) {
                formData.append('id', initialData.id);
                result = await updateSport(formData);
            } else {
                result = await createSport(formData);
            }

            if (result.success) {
                showToast(mode === 'edit' ? 'Updated successfully' : 'Launched successfully', 'success');
                if (onSuccess) onSuccess();
                if (onNavigate) {
                    setTimeout(() => {
                        onNavigate('all-sports');
                    }, 1000);
                }
            } else {
                showToast(result.error || 'Failed to save', 'error');
            }
        } catch (e) {
            showToast('Error saving sport', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stepper */}
            <div className="bg-[#F8F9FA] rounded-2xl md:rounded-3xl border border-[#E5E7EB] px-4 md:px-6 py-3 md:py-4 overflow-x-auto scrollbar-hide">
                <div className="flex items-center w-full min-w-max md:min-w-0 gap-2 md:gap-0">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center flex-1 min-w-0 justify-center md:justify-start">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center text-xs md:text-base font-semibold transition-all border ${currentStep === idx + 1
                                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                    : 'bg-[#F3F4F6] text-[#9CA3AF] border-[#E5E7EB]'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="hidden md:block min-w-0">
                                    <div className={`text-sm font-semibold leading-tight truncate ${currentStep === idx + 1 ? 'text-[#1A1A1A]' : 'text-[#6B7280]'}`}>
                                        {step.name}
                                    </div>
                                    <div className="text-xs text-[#9CA3AF] leading-tight mt-0.5 truncate">Step {idx + 1} of {steps.length}</div>
                                </div>
                            </div>
                            {idx < steps.length - 1 && <div className="h-px w-6 md:flex-1 bg-[#D1D5DB] mx-2 md:mx-3" />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 uppercase tracking-wider">{steps[currentStep - 1]?.name}</h3>
                <div className={mode === 'view' ? 'pointer-events-none opacity-80' : ''}>
                    <CurrentStepComponent
                        data={sportData}
                        hideCoordinatorSection={currentStep === 2 ? (hideStep2Coordinators ?? false) : undefined}
                        updateData={(patch: any) => setSportData({ ...sportData, ...patch })}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-4">
                <button
                    onClick={previousStep}
                    disabled={currentStep === 1}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 font-bold text-xs uppercase tracking-widest disabled:opacity-30"
                >
                    Back
                </button>
                <div className="flex gap-3">
                    {mode !== 'view' && currentStep === steps.length ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all border border-emerald-600 shadow-sm"
                        >
                            {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Launch')}
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            className="px-8 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                        >
                            {currentStep === steps.length ? 'Close' : 'Continue'}
                        </button>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => submitForm('Upcoming')}
                title={mode === 'edit' ? "Confirm Update" : "Confirm Launch"}
                message="Are you sure you want to save these changes?"
                variant="success"
            />
        </div>
    );
}
