import { useState } from "react";
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
  const [remember, setRemember] = useState<boolean>(false);
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
  const navigate = useNavigate();

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

  // Handle Phone Sign In
  const handlePhoneSignIn = async () => {
    const phoneNumber = prompt('Nhập số điện thoại (bắt đầu với +84):');
    if (!phoneNumber) return;
    
    try {
      showInfo('Đang gửi mã xác thực...');
      // Note: RecaptchaVerifier needs to be set up properly in production
      // This is a simplified version
      showError('Tính năng đăng nhập bằng số điện thoại đang được phát triển. Vui lòng sử dụng phương thức khác.');
    } catch (error: any) {
      console.error('Phone sign in error:', error);
      showError('Đăng nhập số điện thoại thất bại: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  return (
    <div className="wrapper">
      <Toaster />
      <Header />
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Chào Mừng Trở Lại!</h1>
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
              onClick={handlePhoneSignIn}
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
    </div>
  );
}

