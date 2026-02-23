import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import Logo from '../../assets/images/Logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e, overrideEmail, overridePass) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    // Use overrides if provided (for quick login), otherwise use state
    const loginEmail = overrideEmail || email;
    const loginPass = overridePass || password;

    try {
      const user = await login(loginEmail, loginPass);
      // Navigate based on role
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else if (['COMPANY_OWNER', 'PM', 'FOREMAN', 'WORKER', 'SUBCONTRACTOR'].includes(user.role)) {
        navigate('/company-admin');
      } else if (user.role === 'CLIENT') {
        navigate('/client-portal');
      } else {
        navigate('/'); // Fallback
      }
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('123456');
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0f172a] overflow-hidden relative font-sans">

      {/* Background with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1920&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)'
        }}
      />

      {/* Left Side: Branding & Demo Access */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-start p-16 z-10 relative overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <img src={Logo} alt="KAAL Constructions" className="h-20 w-auto invert" />
          </div>
          <p className="text-2xl text-slate-300 font-medium tracking-tight">
            Build Smarter. Manage Better.
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Lock size={14} /> Demo Access Guide
            </h3>

            <div className="space-y-4">
              {/* Super Admin Section */}
              <div className="space-y-2">
                <h4 className="text-slate-200 font-bold text-sm">Super Admin (System Level)</h4>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <p className="text-xs text-slate-400 flex justify-between"><span>Email:</span> <code className="text-cyan-300">super@admin.com</code></p>
                  <p className="text-xs text-slate-400 flex justify-between"><span>Pass:</span> <code className="text-cyan-300">123456</code></p>
                  <button onClick={() => fillCredentials('super@admin.com')} className="mt-2 text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/30 transition">Auto-fill</button>
                </div>
              </div>

              {/* Company Admin Section */}
              <div className="space-y-2">
                <h4 className="text-slate-200 font-bold text-sm">Company Admin (KAAL Construction)</h4>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <p className="text-xs text-slate-400 flex justify-between"><span>Email:</span> <code className="text-blue-300">jay@gmail.com</code></p>
                  <p className="text-xs text-slate-400 flex justify-between"><span>Pass:</span> <code className="text-blue-300">123456</code></p>
                  <button onClick={() => fillCredentials('jay@gmail.com')} className="mt-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30 transition">Auto-fill</button>
                </div>
              </div>

              {/* Staff Roles */}
              <div className="space-y-2">
                <h4 className="text-slate-200 font-bold text-sm">Staff &amp; Team Roles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: 'PM', email: 'pm@kaal.ca' },
                    { role: 'Foreman', email: 'foreman@kaal.ca' },
                    { role: 'Worker', email: 'worker@kaal.ca' },
                    { role: 'Subcontractor', email: 'subcontractor@kaal.ca' },
                  ].map(u => (
                    <div key={u.role} className="p-2 bg-white/5 rounded-lg border border-white/5 text-[10px]">
                      <p className="text-slate-300 font-bold mb-1">{u.role}</p>
                      <p className="text-slate-500 break-all">{u.email}</p>
                      <button onClick={() => fillCredentials(u.email)} className="mt-1 text-emerald-400 hover:underline">Select</button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">* Default password for all staff: <span className="text-slate-300 font-bold">123456</span></p>
              </div>

              {/* Subcontractor Section */}
              {/* <div className="space-y-2">
                <h4 className="text-slate-200 font-bold text-sm">🔧 Subcontractor</h4>
                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 space-y-1">
                  <p className="text-xs text-slate-400 flex justify-between"><span>Email:</span> <code className="text-orange-300">subcontractor@kaal.ca</code></p>
                  <p className="text-xs text-slate-400 flex justify-between"><span>Pass:</span> <code className="text-orange-300">123456</code></p>
                  <button onClick={() => fillCredentials('subcontractor@kaal.ca')} className="mt-2 text-[10px] bg-orange-500/20 text-orange-300 px-2 py-1 rounded hover:bg-orange-500/30 transition">Auto-fill</button>
                </div>
              </div> */}

              {/* Client Section */}
              <div className="space-y-2">
                <h4 className="text-slate-200 font-bold text-sm">🏢 Client</h4>
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-1">
                  <p className="text-xs text-slate-400 flex justify-between"><span>Email:</span> <code className="text-purple-300">client@kaal.ca</code></p>
                  <p className="text-xs text-slate-400 flex justify-between"><span>Pass:</span> <code className="text-purple-300">123456</code></p>
                  <button onClick={() => fillCredentials('client@kaal.ca')} className="mt-2 text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-500/30 transition">Auto-fill</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 z-10 bg-white/95 backdrop-blur-sm lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
            <p className="text-slate-500 mt-2 italic text-sm">Use the guide on the left to copy test credentials</p>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin" size={20} /> Authenticating...
                </>
              ) : (
                <>
                  Login to Account <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="lg:hidden p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Test Users</p>
            <p className="text-[10px] text-slate-600 italic">Demo accounts available: super@admin.com, company@admin.com, pm@kaal.ca, client@kaal.ca (Pass: 123456)</p>
          </div>

          <p className="text-center text-slate-500 text-xs font-medium mt-8">
            &copy; 2026 KAAL Construction Enterprise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
