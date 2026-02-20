import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Mail, Lock, User, Phone, ArrowRight, Loader, Globe, CheckCircle } from 'lucide-react';
import Logo from '../../assets/images/Logo.png';
import api from '../../utils/api';

const Register = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const selectedPlan = searchParams.get('plan') || 'starter';

    const [formData, setFormData] = useState({
        companyName: '',
        fullName: '',
        email: '',
        password: '',
        phone: '',
        plan: selectedPlan
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [planDetails, setPlanDetails] = useState(null);

    useEffect(() => {
        const fetchPlanInfo = async () => {
            try {
                const response = await fetch('https://construction-backend-production-b192.up.railway.app/api/plans'); // Adjust if needed
                const data = await response.json();
                const foundPlan = data.find(p => p.name.toLowerCase() === selectedPlan.toLowerCase());
                if (foundPlan) {
                    setPlanDetails(foundPlan);
                }
            } catch (err) {
                console.error("Error fetching plan info", err);
            }
        };
        fetchPlanInfo();
    }, [selectedPlan]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/register-company', formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-emerald-600 w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Registration Pending</h2>
                    <p className="text-slate-600 mb-8 text-lg">
                        Your request has been sent to the Super Admin. You will be able to login once your account is approved.
                    </p>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[progress_3s_ease-in-out]"></div>
                    </div>
                    <p className="text-slate-400 text-sm mt-4 italic">Redirecting to home...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
            <div
                className="flex items-center gap-2 mb-8 cursor-pointer group"
                onClick={() => navigate('/')}
            >
                <img src={Logo} alt="KAAL Constructions" className="h-16 w-auto" />
            </div>

            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
                {/* Left Side: Brand/Info */}
                <div className="md:w-5/12 bg-blue-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Join KAAL Constructions</h2>
                        <p className="text-blue-100 mb-8 leading-relaxed">
                            The all-in-one platform for modern construction management.
                        </p>

                        <div className="space-y-4">
                            {[
                                'Centralized Dashboard',
                                'Real-time GPS Tracking',
                                'Team Collaboration',
                                'Smart Reporting'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle size={12} className="text-white" />
                                    </div>
                                    <span className="text-blue-50 text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 border-t border-blue-500/30">
                        <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-2">Selected Plan</p>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg capitalize">{planDetails?.name || selectedPlan}</span>
                                <span className="text-blue-200 text-sm">{planDetails ? `$${planDetails.price}/${planDetails.period}` : 'Custom Plan'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-7/12 p-8 md:p-12 bg-white">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-800">Create Account</h3>
                        <p className="text-slate-500 mt-1">Start your 14-day free trial</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-3 animate-shake">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company Information</label>
                            <div className="relative">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    name="companyName"
                                    required
                                    placeholder="Your Company Name"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Account Owner</label>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        placeholder="Full Name"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="Work Email"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        placeholder="Phone Number"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="Secure Password"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <Loader className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Create My Account <ArrowRight size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-center text-slate-500 text-sm mt-6">
                            Already have an account? <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>Login</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
