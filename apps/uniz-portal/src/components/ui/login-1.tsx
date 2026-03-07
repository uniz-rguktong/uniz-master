// Login Screen Component

interface LoginScreenProps {
    isLogin?: boolean;
    onToggleMode?: () => void;
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
    heroTitle?: string;
    bottomText?: string;
}

export default function LoginScreen({
    isLogin = true,
    onToggleMode,
    title,
    subtitle,
    children,
    heroTitle,
    bottomText
}: LoginScreenProps) {
    return (
        <div className="w-full min-h-screen flex bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Left side - Hero section */}
            <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Abstract background elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
                </div>

                {heroTitle && (
                    <div className="text-white max-w-xl relative z-10 text-center">
                        <h1 className="text-6xl font-black mb-8 leading-[1.1] tracking-tight">
                            {heroTitle}
                        </h1>
                        <div className="w-20 h-1.5 bg-blue-500 rounded-full mx-auto" />
                    </div>
                )}

                {/* Dynamic Image Overlay */}
                <div className="absolute inset-0 z-0 scale-100">
                    <img
                        src="/assets/signIn.png"
                        alt="UNIZ Login"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Bottom Text */}
                {bottomText && (
                    <div className="absolute bottom-10 left-0 w-full text-center z-20">
                        <span className="text-white/80 font-bold tracking-[0.3em] uppercase text-sm">
                            {bottomText}
                        </span>
                    </div>
                )}
            </div>

            {/* Right side - Login/Signup form */}
            <div className="flex-1 bg-white flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
                    {/* Logo Section */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center mb-6">
                            <span className="unifrakturcook-bold text-5xl text-slate-900 tracking-tight leading-none">
                                uniZ
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                            {title || (isLogin ? 'Welcome Back' : 'Join Us Today')}
                        </h2>
                        <p className="text-slate-500 font-medium text-[15px]">
                            {subtitle || (isLogin
                                ? 'Continue your journey with the UNIZ portal'
                                : 'Start your journey with the UNIZ portal'
                            )}
                        </p>
                    </div>

                    {/* Form Content */}
                    <div className="space-y-6">
                        {children}
                    </div>

                    {/* Optional Toggle Mode (Hidden if not provided) */}
                    {onToggleMode && (
                        <div className="text-center mt-8 pt-8 border-t border-slate-100">
                            <span className="text-slate-500">
                                {isLogin ? "Don't have an account?" : "Already have account?"}
                            </span>{' '}
                            <button
                                type="button"
                                onClick={onToggleMode}
                                className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
                            >
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
