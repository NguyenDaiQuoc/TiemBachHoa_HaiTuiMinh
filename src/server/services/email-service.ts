import { env } from "../../shared/config/env.js";

/**
 * Transactional Email Infrastructure (Stub)
 * Implementation for Resend/SendGrid should be added here
 */
export const sendEmail = async (to: string, subject: string, template: string, data: any) => {
  console.log(`[EMAIL SERVICE] Sending ${template} email to ${to} with subject: ${subject}`);
  
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with a real provider (e.g., Resend)
    console.log("Production email service triggered. Stub only.");
  } else {
    // Development mode: Mock output
    console.log("Email parameters:", { to, subject, template, data });
  }
  
  return { success: true, messageId: `msg_${Math.random().toString(36).substring(7)}` };
};

export const sendVerificationEmail = (email: string, token: string) => {
  const verifyUrl = `${env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
  return sendEmail(email, "Xác thực tài khoản | Hai Tụi Mình", "verification", { verifyUrl });
};

export const sendPasswordResetEmail = (email: string, token: string) => {
  const resetUrl = `${env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  return sendEmail(email, "Đặt lại mật khẩu | Hai Tụi Mình", "password-reset", { resetUrl });
};
