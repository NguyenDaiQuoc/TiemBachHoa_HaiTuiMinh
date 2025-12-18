import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/register.css";
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Input component dùng chung
function AuthInput({ label, placeholder, type = "text", required = false, value, onChange }: any) {
  const inputId = `register-${label.toLowerCase().replace(/\s+/g, '-')}`;
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

// Form Register
function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [account, setAccount] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (password !== confirm) return setError('Mật khẩu xác nhận không khớp');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      await setDoc(doc(db, 'users', uid), {
        account,
        fullName,
        email,
        phone: '',
        address: '',
        profilePictureURL: '',
        status: 'active',
        isDeactivated: 'none',
        vip: 'Thường',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đăng ký thất bại');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <AuthInput label="Họ và Tên" placeholder="Ví dụ: Nguyễn Văn A" required value={fullName} onChange={(e:any)=>setFullName(e.target.value)} />
      <AuthInput label="Tài khoản (account)" placeholder="Tên đăng nhập" required value={account} onChange={(e:any)=>setAccount(e.target.value)} />
      <AuthInput label="Email" placeholder="Địa chỉ email hợp lệ" type="email" required value={email} onChange={(e:any)=>setEmail(e.target.value)} />
      <AuthInput label="Mật Khẩu" placeholder="Tối thiểu 6 ký tự" type="password" required value={password} onChange={(e:any)=>setPassword(e.target.value)} />
      <AuthInput label="Xác nhận Mật Khẩu" placeholder="Nhập lại mật khẩu" type="password" required value={confirm} onChange={(e:any)=>setConfirm(e.target.value)} />

      <div className="auth-terms">
        <input 
          type="checkbox" 
          id="register-terms" 
          name="terms" 
          required 
          className="auth-checkbox" 
        />
        <label htmlFor="register-terms">
          Tôi đồng ý với <a href="#" className="auth-link">Điều khoản dịch vụ</a> và <a href="#" className="auth-link">Chính sách bảo mật</a>.
        </label>
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="auth-btn">Đăng Ký</button>
    </form>
  );
}

// Main Register Page
export default function RegisterPage() {
  return (
    <div className="auth-wrapper">
      <Header />
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Gia Nhập Ngôi Nhà Ấm Cúng</h1>
          <RegisterForm />
        </div>
      </div>
      <FloatingButtons />
      <Footer />
    </div>
  );
}
