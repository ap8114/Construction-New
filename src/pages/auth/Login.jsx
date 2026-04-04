import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader, ChevronRight } from 'lucide-react';
import Logo from '../../assets/images/Logo.png';

const DEMO_USERS = [
  { label: 'Super Admin', email: 'super@admin.com', color: '#06b6d4' },
  { label: 'Company Owner', email: 'jay@gmail.com', color: '#155dff' },
  { label: 'Project Manager', email: 'pm@kaal.ca', color: '#10b981' },
  { label: 'Foreman', email: 'foreman@kaal.ca', color: '#f59e0b' },
  { label: 'Worker', email: 'worker@kaal.ca', color: '#8b5cf6' },
  { label: 'Subcontractor', email: 'subcontractor@kaal.ca', color: '#f97316' },
  { label: 'Client', email: 'client@kaal.ca', color: '#ec4899' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'SUPER_ADMIN') navigate('/super-admin');
      else if (['COMPANY_OWNER', 'PM', 'FOREMAN', 'WORKER', 'SUBCONTRACTOR'].includes(user.role)) navigate('/company-admin');
      else if (user.role === 'CLIENT') navigate('/client-portal');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally { setSubmitting(false); }
  };

  const fill = (e) => { setEmail(e); setPassword('123456'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif", background: '#f8fafc' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        /* ── inputs ── */
        .li {
          width: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px 12px 44px;
          color: #0f172a;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .li::placeholder { color: #94a3b8; }
        .li:focus {
          border-color: #155dff;
          box-shadow: 0 0 0 3px rgba(21,93,255,0.1);
        }

        /* ── login button ── */
        .btn-login {
          width: 100%; background: #155dff; color: #fff; border: none;
          border-radius: 10px; padding: 13px;
          font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: all 0.22s; letter-spacing: 0.02em;
        }
        .btn-login:hover:not(:disabled) {
          background: #1a6fff; transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(21,93,255,0.35);
        }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── demo pill ── */
        .dpill {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: #fff; border: 1px solid #e2e8f0;
          cursor: pointer; transition: all 0.18s;
          text-align: left; width: 100%;
          font-family: 'DM Sans', sans-serif;
        }
        .dpill:hover {
          border-color: #155dff;
          background: #f0f5ff;
          transform: translateX(2px);
        }

        /* ── animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }

        @keyframes shake {
          0%,100% { transform: translateX(0);  }
          20%,60%  { transform: translateX(-4px); }
          40%,80%  { transform: translateX(4px);  }
        }
        .shake { animation: shake 0.38s ease; }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        /* ── responsive ── */
        @media (min-width: 1024px) {
          #lp  { display: flex !important;  }
          #mdm { display: none !important;  }
        }
      `}</style>

      {/* ══ LEFT PANEL — Demo Guide ══════════════════════════════════════════ */}
      <div
        id="lp"
        style={{
          width: '40%', display: 'none', flexDirection: 'column',
          justifyContent: 'center', padding: '48px 40px',
          background: '#0f172a',
          borderRight: '1px solid #1e293b',
          overflowY: 'auto', position: 'relative',
        }}
      >
        {/* subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(21,93,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(21,93,255,0.05) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 50% at 20% 30%, rgba(21,93,255,0.14) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Info on left panel */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>
              Demo Environment
            </div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#fff', lineHeight: 1 }}>QUICK ACCESS</div>
            <div style={{ width: 32, height: 2, background: '#155dff', borderRadius: 2, marginTop: 10 }} />
          </div>

          {/* info */}
          <div style={{ background: 'rgba(21,93,255,0.1)', border: '1px solid rgba(21,93,255,0.22)', borderRadius: 12, padding: '12px 16px', marginBottom: 22, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Lock size={13} color="#155dff" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
              Click any role to auto-fill credentials. Default password: <span style={{ color: '#fff', fontWeight: 600 }}>123456</span>
            </p>
          </div>

          {/* roles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {DEMO_USERS.map(u => (
              <button key={u.email} className="dpill"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(21,93,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(21,93,255,0.35)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                onClick={() => fill(u.email)}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${u.color}18`, border: `1px solid ${u.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: u.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{u.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <ChevronRight size={13} color="rgba(255,255,255,0.18)" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — Login Form ══════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px 24px', position: 'relative', overflowY: 'auto',
        background: '#f8fafc',
      }}>
        {/* Subtle decoration top-right */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(21,93,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(21,93,255,0.04)', pointerEvents: 'none' }} />

        <div className="fade-up" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Logo + heading */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <img src={Logo} alt="KAAL" style={{ height: 52, width: 'auto', marginBottom: 20, display: 'block', margin: '0 auto' }} />
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 30, color: '#0f172a', letterSpacing: '0.03em' }}>SIGN IN</div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Access your construction dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="shake" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" className="li" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="password" className="li" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={isSubmitting} style={{ marginTop: 4 }}>
              {isSubmitting
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</>
                : <>Login to Account <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Mobile quick demo */}
          <div id="mdm" style={{ marginTop: 24, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
              Quick Demo Access
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {DEMO_USERS.slice(0, 4).map(u => (
                <button key={u.email} onClick={() => fill(u.email)} style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                  padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s', fontFamily: "'DM Sans', sans-serif",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff4ff'; e.currentTarget.style.borderColor = '#155dff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: u.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{u.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 24 }}>
            © {new Date().getFullYear()} KAAL Construction Enterprise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;