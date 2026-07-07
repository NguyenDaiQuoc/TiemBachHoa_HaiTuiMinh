import { describe, expect, it } from 'vitest';
import { getPasswordChecks, getPasswordStrength, isStrongPassword, strongPasswordMessage } from './password-policy';

describe('password policy', () => {
  it('accepts passwords from 8 to 32 characters with uppercase, number, and special character', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true);
    expect(isStrongPassword('A'.padEnd(30, 'b') + '1!')).toBe(true);
  });

  it('rejects weak or out-of-range passwords', () => {
    expect(isStrongPassword('Abc1!')).toBe(false);
    expect(isStrongPassword('abcdef1!')).toBe(false);
    expect(isStrongPassword('ABCDEFG!')).toBe(false);
    expect(isStrongPassword('Abcdef12')).toBe(false);
    expect(isStrongPassword('Abcdef1!' + 'x'.repeat(25))).toBe(false);
  });

  it('reports each checklist item for the strength meter', () => {
    expect(getPasswordChecks('abcdefg')).toEqual([
      { label: '8-32 ký tự', passed: false },
      { label: 'Chữ hoa', passed: false },
      { label: 'Số', passed: false },
      { label: 'Ký tự đặc biệt', passed: false },
    ]);

    expect(getPasswordChecks('Abcdef1!').every((item) => item.passed)).toBe(true);
  });

  it('returns user-facing strength metadata', () => {
    expect(getPasswordStrength('').label).toBe('Chưa nhập mật khẩu');
    expect(getPasswordStrength('abcdef12').label).toBe('Chưa đủ mạnh');
    expect(getPasswordStrength('Abcdef1!')).toMatchObject({
      score: 4,
      tone: 'bg-emerald-500',
      label: 'Mật khẩu hợp lệ',
    });
    expect(strongPasswordMessage).toContain('8-32');
  });
});
