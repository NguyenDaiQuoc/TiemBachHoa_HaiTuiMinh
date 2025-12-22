import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/login.css";
import { auth, db, firebaseApiKey } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { showSuccess, showError } from '../utils/toast';
import { Toaster } from 'react-hot-toast';

// Input component dùng chung
function AuthInput({ label, placeholder, type = "text", required = false, value, onChange }: any) {
  const inputId = `login-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="auth-input-group">
      <label className="auth-label" htmlFor={inputId}>
        {label} {required && <span className="auth-required">*</span>}
      </label>
      <input 
        id={inputId}
        name={inputId}
        value={value} 
        onChange={onChange} 
        type={type} 
        placeholder={placeholder} 
        required={required} 
        className="auth-input" 
      />
    </div>
  );
}

// Form Login
// Phone login form (UI only; actual SMS verification requires Recaptcha + firebase backend)
function PhoneForm({ onBack }: { onBack?: () => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Trạng thái đang gửi mã
  const [networkBlocked, setNetworkBlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let t: any;
    if (countdown > 0) {
      t = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [countdown]);

  // Hàm khởi tạo reCAPTCHA (Chỉ tạo 1 lần hoặc reset khi lỗi)
  const setupRecaptcha = () => {
    try {
      // Clear previous verifier instance when present
      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch(e) { /* ignore */ }
        (window as any).recaptchaVerifier = null;
        const el = document.getElementById('recaptcha-container');
        if (el) el.innerHTML = '';
      }

      // Correct signature in this project: new RecaptchaVerifier(auth, containerId, params)
      // Use 'normal' so the visible widget is rendered under the phone input.
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: (response: any) => {
          // reCAPTCHA solved (no console log to reduce noise in production)
        },
        'expired-callback': () => {
          showError('reCAPTCHA hết hạn, vui lòng thử lại.');
        }
  });
    } catch (setupErr) {
      console.error('setupRecaptcha failed', setupErr);
      // Leave a visible container so Firebase can fallback and render v2 widget
      const el = document.getElementById('recaptcha-container');
      if (el) el.style.display = 'block';
    }
  };

  // Cleanup reCAPTCHA when the PhoneForm unmounts to avoid duplicate widgets
  useEffect(() => {
    return () => {
      try {
        if ((window as any).recaptchaVerifier) {
          try { (window as any).recaptchaVerifier.clear(); } catch(e) { /* ignore */ }
          (window as any).recaptchaVerifier = null;
        }
        const el = document.getElementById('recaptcha-container');
        if (el) el.innerHTML = '';
      } catch (e) {
        console.warn('Error cleaning up recaptcha', e);
      }
    };
  }, []);

  const sendCode = async () => {
    if (loading || countdown > 0) return;

    let normalized = String(phone || '').trim();
    // Chuẩn hóa số điện thoại VN: bỏ số 0 đầu, thêm +84
    if (normalized.startsWith('0')) {
      normalized = '+84' + normalized.slice(1);
    }
    if (!normalized.startsWith('+')) {
      normalized = '+84' + normalized;
    }

    if (!/^\+\d{10,15}$/.test(normalized)) {
      showError('Số điện thoại không đúng định dạng (VD: 0912...).');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const verifier = (window as any).recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
      setConfirmResult(confirmation);
      setOtpSent(true);
      setCountdown(60);
      showSuccess('Mã OTP đã được gửi!');
    } catch (e: any) {
      console.error('sendCode error', e);
      // Reset reCAPTCHA nếu lỗi để lần sau bấm lại không bị kẹt container
      if (document.getElementById('recaptcha-container')) {
          document.getElementById('recaptcha-container')!.innerHTML = '';
      }

      // Friendly error messages for common failure modes
      let msg = 'Không thể gửi mã';
      const code = e?.code || '';
      if (code === 'auth/invalid-phone-number') msg = 'Số điện thoại không hợp lệ';
      else if (code === 'auth/too-many-requests') msg = 'Thử lại quá nhiều lần, vui lòng đợi';
      else if (code === 'auth/operation-not-allowed') msg = 'Phone sign-in chưa được bật cho dự án Firebase (bật Phone provider trong Firebase Console)';
      else if (String(e).toLowerCase().includes('blocked') || String(e?.message || '').toLowerCase().includes('blocked') || String(e).includes('ERR_BLOCKED_BY_CLIENT')) {
        msg = 'Yêu cầu mạng bị chặn bởi extension/proxy (ví dụ: adblock). Thử tắt extension hoặc dùng tab ẩn danh.';
        try { setNetworkBlocked(true); } catch(_) {}
      } else if (e?.message && e?.message.includes('400')) {
        msg = 'Yêu cầu tới server bị từ chối (400). Kiểm tra Authorized domains trong Firebase và API key.';
      }

      showError(`${msg}${e?.message ? ' — ' + e.message : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!otp || otp.length < 6) {
      showError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    setLoading(true);
    try {
      const userCred = await confirmResult.confirm(otp);
      const user = userCred.user;
      
      // Kiểm tra/Tạo user trong Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          account: user.phoneNumber?.replace('+', '') || '',
          fullName: 'Người dùng mới',
          email: '',
          phone: user.phoneNumber || '',
          status: 'active',
          vip: 'Thường',
          createdAt: serverTimestamp(),
        });
      }

      showSuccess('Đăng nhập thành công!');
      setTimeout(() => navigate('/'), 800);
    } catch (e: any) {
      if (String(e).toLowerCase().includes('blocked') || String(e?.message || '').toLowerCase().includes('blocked') || String(e).includes('ERR_BLOCKED_BY_CLIENT')) {
        try { setNetworkBlocked(true); } catch(_) {}
        showError('Mã xác thực không thể xác minh do kết nối bị chặn (xem thông báo).');
      } else {
        showError('Mã xác thực không đúng hoặc đã hết hạn.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-form">
      {networkBlocked && (
        <div className="form-warn" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>Kết nối tới Firebase có vẻ bị chặn bởi extension hoặc proxy. Thử tắt adblock hoặc mở trang trong cửa sổ ẩn danh.</div>
          <button className="auth-link-btn" style={{ marginLeft: 8 }} onClick={() => setNetworkBlocked(false)}>Đã hiểu</button>
        </div>
      )}
      <div className="phone-input-row">
        <input 
          className="auth-input" 
          placeholder="Nhập số điện thoại (VD: 0912...)" 
          value={phone} 
          disabled={otpSent}
          onChange={(e)=>setPhone(e.target.value)} 
        />
        <button type="button" className="auth-btn small" disabled={loading || countdown > 0} onClick={sendCode}>
          {loading ? (<><span className="spinner"/> Đang gửi</>) : (otpSent ? `Gửi lại (${countdown}s)` : 'Gửi mã')}
        </button>
      </div>
        {/* recaptcha container placed under the phone input for better visibility */}
        <div id="recaptcha-container" className="recaptcha-box" />
      
      {otpSent && (
        <div className="otp-row" style={{ marginTop: '15px' }}>
          <input 
            className="auth-input" 
            placeholder="Nhập 6 số OTP" 
            value={otp} 
            onChange={(e)=>setOtp(e.target.value)} 
            maxLength={6}
          />
          <button type="button" className="auth-btn small" disabled={loading} onClick={verifyCode}>
            {loading ? (<><span className="spinner"/> Đang xác thực</>) : 'Xác thực'}
          </button>
        </div>
      )}
      <button type="button" className="auth-link-btn" style={{marginTop: '10px'}} onClick={onBack}>Quay lại</button>
    </div>
  );
}

function LoginForm() {
  const [identifier, setIdentifier] = useState(''); // email or account
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  // const [debugInfo, setDebugInfo] = useState<any>(null);
  const [plainPasswordWarning, setPlainPasswordWarning] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- simple client-side captcha for login (mixed-case + digits) ---
  const generateCaptcha = (len = 6) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  };
  const [captcha, setCaptcha] = useState<string>(() => generateCaptcha(6));
  const [captchaInput, setCaptchaInput] = useState('');

  const renderCaptcha = (code: string) => {
    try {
      const canvas = document.getElementById('login-captcha-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width = 150;
      const h = canvas.height = 42;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0,0,w,h);
      // noise lines
      for (let i=0;i<4;i++){
        ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random()*0.15})`;
        ctx.beginPath();
        ctx.moveTo(Math.random()*w, Math.random()*h);
        ctx.lineTo(Math.random()*w, Math.random()*h);
        ctx.stroke();
      }
      const spacing = w / (code.length + 1);
      for (let i=0;i<code.length;i++){
        const ch = code[i];
        ctx.font = `${18 + Math.round(Math.random()*6)}px sans-serif`;
        ctx.fillStyle = `rgb(${50+Math.round(Math.random()*120)}, ${30+Math.round(Math.random()*120)}, ${30+Math.round(Math.random()*120)})`;
        const x = spacing*(i+1) + (Math.random()*6-3);
        const y = 24 + (Math.random()*6-3);
        const ang = (Math.random()*24-12) * Math.PI/180;
        ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.fillText(ch, 0, 0); ctx.restore();
      }
    } catch (e) { /* ignore canvas errors */ }
  };

  const refreshCaptcha = () => {
    const next = generateCaptcha(6);
    setCaptcha(next);
    setCaptchaInput('');
    setTimeout(()=>renderCaptcha(next), 40);
  };

  // render on mount/update
  useEffect(()=>{ renderCaptcha(captcha); }, [captcha]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // validate captcha first
    if ((captchaInput || '').trim() === '') {
      setError('Vui lòng nhập mã xác thực hiển thị dưới đây');
      setLoading(false);
      return;
    }
    if (captchaInput.trim() !== captcha) {
      setError('Mã xác thực không đúng, vui lòng thử lại');
      refreshCaptcha();
      setLoading(false);
      return;
    }
    try {
      // 1) Kiểm tra identifier (account hoặc email)
      const idTrim = String(identifier || '').trim();
      if (!idTrim) {
        setError('Vui lòng nhập tài khoản hoặc email');
        return;
      }

      // 2) Resolve email từ identifier
      let emailToUse = '';
      if (idTrim.includes('@')) {
        emailToUse = idTrim;
      } else {
        const q = query(collection(db, 'users'), where('account', '==', idTrim));
        const snap = await getDocs(q);
        if (!snap.empty) {
          emailToUse = String(snap.docs[0].data().email || '').trim();
          } else {
            try {
              const q2 = query(collection(db, 'users'), where('email', '==', idTrim));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                const data = snap2.docs[0].data() as any;
                emailToUse = String(data.email || '').trim();
                // Warn if a plaintext password field exists in the user document
                if (data.password) {
                  setPlainPasswordWarning('Lưu ý: tài khoản này có trường password trong Firestore (plaintext). Hãy xóa trường này để bảo mật.');
                }
              }
            } catch (q2err: any) {
              console.error('Error reading users collection:', q2err);
              if ((q2err?.message || '').includes('ERR_BLOCKED_BY_CLIENT')) {
                setError('Yêu cầu mạng bị chặn bởi extension/proxy. Hãy thử trong chế độ ẩn danh hoặc tắt extension chặn mạng (adblock).');
              } else {
                setError('Không thể truy vấn thông tin tài khoản (kiểm tra kết nối)');
              }
              return;
            }
          }
      }

      if (!emailToUse) {
        setError('Không tìm thấy tài khoản hoặc email');
        return;
      }

      // 3) Chỉ khi có email thì mới kiểm tra password (theo yêu cầu)
      // Trim password to avoid accidental leading/trailing spaces
      const pwdTrim = String(password || '').trim();
      if (!pwdTrim) {
        setError('Vui lòng nhập mật khẩu');
        return;
      }
      // Basic length check (Firebase requires >= 6 for email/password accounts)
      if (pwdTrim.length < 6) {
        setError('Mật khẩu quá ngắn (tối thiểu 6 ký tự)');
        // setDebugInfo((d:any) => ({ ...d, pwdLen: pwdTrim.length }));
        return;
      }

  // Debug: log resolved email and password length (không in password)
  console.debug('Attempting signInWithEmailAndPassword for', { emailToUse, pwdLen: pwdTrim.length });
  // expose debug info on the UI to help troubleshooting (dev only)
  // setDebugInfo({ emailToUse, pwdLen: pwdTrim.length });

      // Set persistence based on remember checkbox
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      } catch (persErr: any) {
        console.warn('setPersistence failed', persErr);
      }

      // Kiểm tra định dạng email cơ bản
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToUse)) {
        setError('Địa chỉ email không hợp lệ');
        return;
      }

      // Log the request shape (without the password) to help debug network issues
      console.debug('Calling Firebase signInWithEmailAndPassword', { email: emailToUse, returnSecureToken: true });
      await signInWithEmailAndPassword(auth, emailToUse, pwdTrim);

      // Save auth state to localStorage for instant restoration on app reload
      try {
        const user = auth.currentUser;
        if (user) {
          localStorage.setItem('tiem_user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }));
        }
      } catch (e) {
        console.warn('localStorage set user failed', e);
      }

      // If remember was checked, store an expiry timestamp (7 days). We'll enforce expiry on app start.
      try {
        if (remember) {
          const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
          localStorage.setItem('remember_until', String(expiry));
        } else {
          localStorage.removeItem('remember_until');
        }
      } catch (e) {
        console.warn('localStorage set remember failed', e);
      }

      showSuccess('Đăng nhập thành công!');
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      console.error('Login error:', err);
      // Special-case: detect network blocked errors seen in DevTools (blocked by extension)
      if ((err?.message || '').includes('blocked') || (err?.message || '').includes('ERR_BLOCKED_BY_CLIENT')) {
        setError('Các kết nối tới Google bị chặn bởi extension/proxy; thử tắt extension (adblock/privacy) hoặc dùng tab ẩn danh.');
        // setDebugInfo((d:any) => ({ ...d, errCode: err?.code, errMessage: err?.message }));
        return;
      }
      const code = err?.code || '';
      if (code === 'auth/wrong-password') setError('Mật khẩu không đúng');
      else if (code === 'auth/user-not-found') setError('Không tìm thấy tài khoản');
      else if (code === 'auth/invalid-email') setError('Định dạng email không hợp lệ');
      else if (code === 'auth/invalid-credential') setError('Thông tin đăng nhập không hợp lệ (vui lòng thử lại)');
      else setError(err.message || 'Đăng nhập thất bại');
      // show raw error code/message in debugInfo for easier diagnosis
      // setDebugInfo((d:any) => ({ ...d, errCode: err?.code, errMessage: err?.message }));
    }
    finally {
      setLoading(false);
    }
  };

  // Direct REST test to Identity Toolkit - helps determine if requests are being modified by extensions/proxies
  /*const runDirectApiTest = async () => {
    try {
      const payload = { email: identifier || '', password: password || '', returnSecureToken: true };
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
      // setDebugInfo((d:any)=>({...d, directTest: { url, requestBody: payload }}));
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch(e){ json = text; }
      // setDebugInfo((d:any)=>({...d, directTest: { status: res.status, response: json }}));
      if (!res.ok) setError(`Direct API test returned ${res.status} — xem debug dưới`);
    } catch (e: any) {
      console.error('Direct API test failed:', e);
      setError('Direct API test thất bại — có thể do extension/proxy. Thử lại trong tab ẩn danh.');
      // setDebugInfo((d:any)=>({...d, directTestErr: e?.message || String(e)}));
    }
  };*/

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <AuthInput label="Tài khoản hoặc Email" placeholder="Email hoặc account" type="text" required value={identifier} onChange={(e:any)=>setIdentifier(e.target.value)} />
      <AuthInput label="Mật Khẩu" placeholder="Nhập mật khẩu" type="password" required value={password} onChange={(e:any)=>setPassword(e.target.value)} />

      <div className="auth-options">
        <label className="auth-checkbox-label">
          <input 
            type="checkbox" 
            id="login-remember" 
            name="remember" 
            className="auth-checkbox" 
          /> Ghi nhớ đăng nhập
        </label>
        <a href="#" className="auth-link">Quên mật khẩu?</a>
      </div>

      {/* CAPTCHA: canvas + input */}
      <div style={{ display:'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <canvas id="login-captcha-canvas" width={150} height={42} style={{ borderRadius:6, border:'1px solid #e5e7eb' }} />
        <div style={{ display:'flex', gap:6 }}>
          <input className="auth-input" placeholder="Nhập mã hiển thị" value={captchaInput} onChange={(e)=>setCaptchaInput(e.target.value)} />
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" className="auth-link-btn" onClick={refreshCaptcha}>Làm mới</button>
          </div>
        </div>
      </div>

  {error && <div className="form-error">{error}</div>}
  {plainPasswordWarning && <div className="form-warn" style={{color:'#7a3'}}>{plainPasswordWarning}</div>}

      {/* Debug panel - show resolved email/pwd length and raw error code (dev only) */}
      {/* <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" className="auth-btn" onClick={runDirectApiTest} style={{ background:'#4A5568' }}>Chạy kiểm tra API trực tiếp</button>
      </div> */}

      {/* {debugInfo && (
        <pre style={{ fontSize: 12, marginTop: 8, background: '#fff8', padding: 8, textAlign: 'left', overflowX: 'auto' }}>{JSON.stringify(debugInfo, null, 2)}</pre>
      )} */}

      <button type="submit" className="auth-btn" disabled={loading}>{loading ? (<><span className="spinner"/> Đang đăng nhập</>) : 'Đăng Nhập'}</button>
    </form>
  );
}

// Main Login Page
export default function LoginPage() {
  const navigate = useNavigate();
  // Default to email/password login. Phone form opens in a modal when requested.
  const [mode, setMode] = useState<'email'|'phone'>('email');
  const [phoneFormVisible, setPhoneFormVisible] = useState(false);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          account: user.email?.split('@')[0] || '',
          fullName: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          profilePictureURL: user.photoURL || '',
          status: 'active',
          isDeactivated: 'none',
          vip: 'Thường',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      showSuccess('Đăng nhập thành công với Google!');
      setTimeout(() => navigate('/'), 500);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      showError('Đăng nhập Google thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  // Handle Facebook Sign In
  const handleFacebookSignIn = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          account: user.email?.split('@')[0] || '',
          fullName: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || '',
          profilePictureURL: user.photoURL || '',
          status: 'active',
          isDeactivated: 'none',
          vip: 'Thường',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      showSuccess('Đăng nhập thành công với Facebook!');
      setTimeout(() => navigate('/'), 500);
    } catch (error: any) {
      console.error('Facebook sign in error:', error);
      showError('Đăng nhập Facebook thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  // Note: We render a PhoneForm UI; actual SMS flow requires Recaptcha + firebase signInWithPhoneNumber

  return (
    <div className="auth-wrapper">
      <Toaster />
      <Header />
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Chào Mừng Trở Lại!</h1>

          <div className="auth-tabs">
            {/* <button className={`tab ${mode === 'email' ? 'active' : ''}`} onClick={() => { setMode('email'); }}>Email</button> */}
            {/* Phone tab behaves as a button to open the phone modal (no inline form) */}
            {/* <button className={`tab`} onClick={() => { setPhoneFormVisible(true); }}>Số điện thoại</button> */}
          </div>

          { /* Always show LoginForm in card by default */ }
          <LoginForm />
          
          {/* Social Login Section */}
          <div className="auth-divider">
            <span>Hoặc đăng nhập với</span>
          </div>
          
          <div className="auth-social-buttons">
            <button 
              type="button" 
              className="auth-social-btn google"
              onClick={handleGoogleSignIn}
            >
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            
            <button 
              type="button" 
              className="auth-social-btn facebook"
              onClick={handleFacebookSignIn}
            >
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            
            <button 
              type="button" 
              className="auth-social-btn phone"
              onClick={() => { setMode('phone'); setPhoneFormVisible(true); }}
            >
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              Số điện thoại
            </button>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
          </div>
        </div>
      </div>
      <FloatingButtons />
      <Footer />
      {/* Phone Modal */}
      {phoneFormVisible && (
        <div className="phone-modal" role="dialog" aria-modal="true">
          <div className="phone-modal-card">
            <button className="modal-close" aria-label="Đóng" onClick={() => setPhoneFormVisible(false)}>×</button>
            <h2 style={{ marginTop: 0 }}>Đăng nhập bằng Số điện thoại</h2>
              <PhoneForm onBack={() => setPhoneFormVisible(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

