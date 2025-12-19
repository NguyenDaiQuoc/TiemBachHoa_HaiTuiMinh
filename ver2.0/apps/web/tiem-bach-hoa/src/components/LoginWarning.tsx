import React from "react";
import { useNavigate } from "react-router-dom";

interface LoginWarningProps {
  message?: string;
  onClose?: () => void;
}

export default function LoginWarning({ 
  message = "Vui lòng đăng nhập để sử dụng tính năng này", 
  onClose 
}: LoginWarningProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    if (onClose) onClose();
    navigate('/login');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '28rem',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{marginBottom: '1.5rem', fontSize: '3.75rem'}}>
          🔒
        </div>

        {/* Message */}
        <h2 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.75rem'}}>
          Yêu Cầu Đăng Nhập
        </h2>
        <p style={{color: '#4b5563', marginBottom: '2rem'}}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'center'}}>
          <button
            onClick={handleLogin}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: '#C75F4B',
              color: 'white',
              fontWeight: 600,
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a84d3d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C75F4B'}
          >
            Đăng nhập
          </button>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              fontWeight: 600,
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          >
            Đóng
          </button>
        </div>

        {/* Register link */}
        <p style={{marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280'}}>
          Chưa có tài khoản?{" "}
          <button 
            onClick={() => navigate('/register')}
            style={{
              color: '#C75F4B',
              fontWeight: 600,
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}
