import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/login.css";
import { useNavigate } from 'react-router-dom';
import { auth, db, firebaseApiKey } from '../firebase';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { showSuccess, showError } from '../utils/toast';
import toast, { Toaster } from 'react-hot-toast';

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
function LoginForm() {
  const [identifier, setIdentifier] = useState(''); // email or account
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState<boolean>(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [plainPasswordWarning, setPlainPasswordWarning] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
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
        setDebugInfo((d:any) => ({ ...d, pwdLen: pwdTrim.length }));
        return;
      }

  // Debug: log resolved email and password length (không in password)
  console.debug('Attempting signInWithEmailAndPassword for', { emailToUse, pwdLen: pwdTrim.length });
  // expose debug info on the UI to help troubleshooting (dev only)
  setDebugInfo({ emailToUse, pwdLen: pwdTrim.length });

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
  const cred = await signInWithEmailAndPassword(auth, emailToUse, pwdTrim);

      // Cache user uid/profile in localStorage so header can show immediate info while auth initializes
      try {
        const uid = cred.user?.uid;
        if (uid) {
          localStorage.setItem('last_signed_in_uid', uid);
          try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              localStorage.setItem('user_profile_cache', JSON.stringify(userSnap.data()));
            }
          } catch (cacheErr) {
            // ignore
          }
        }
      } catch (e) {
        // ignore caching errors
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
        setDebugInfo((d:any) => ({ ...d, errCode: err?.code, errMessage: err?.message }));
        return;
      }
      const code = err?.code || '';
      if (code === 'auth/wrong-password') setError('Mật khẩu không đúng');
      else if (code === 'auth/user-not-found') setError('Không tìm thấy tài khoản');
      else if (code === 'auth/invalid-email') setError('Định dạng email không hợp lệ');
      else if (code === 'auth/invalid-credential') setError('Thông tin đăng nhập không hợp lệ (vui lòng thử lại)');
      else setError(err.message || 'Đăng nhập thất bại');
      // show raw error code/message in debugInfo for easier diagnosis
      setDebugInfo((d:any) => ({ ...d, errCode: err?.code, errMessage: err?.message }));
    }
  };

  // Direct REST test to Identity Toolkit - helps determine if requests are being modified by extensions/proxies
  const runDirectApiTest = async () => {
    try {
      const payload = { email: identifier || '', password: password || '', returnSecureToken: true };
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
      setDebugInfo((d:any)=>({...d, directTest: { url, requestBody: payload }}));
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch(e){ json = text; }
      setDebugInfo((d:any)=>({...d, directTest: { status: res.status, response: json }}));
      if (!res.ok) setError(`Direct API test returned ${res.status} — xem debug dưới`);
    } catch (e: any) {
      console.error('Direct API test failed:', e);
      setError('Direct API test thất bại — có thể do extension/proxy. Thử lại trong tab ẩn danh.');
      setDebugInfo((d:any)=>({...d, directTestErr: e?.message || String(e)}));
    }
  };

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
            checked={remember}
            onChange={(e:any)=>setRemember(Boolean(e.target.checked))}
          /> Ghi nhớ đăng nhập
        </label>
        <a href="#" className="auth-link">Quên mật khẩu?</a>
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

      <button type="submit" className="auth-btn">Đăng Nhập</button>
    </form>
  );
}

// Main Login Page
export default function LoginPage() {
  return (
    <div className="auth-wrapper">
      <Toaster />
      <Header />
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Chào Mừng Trở Lại!</h1>
          <LoginForm />
        </div>
      </div>
      <FloatingButtons />
      <Footer />
    </div>
  );
}
