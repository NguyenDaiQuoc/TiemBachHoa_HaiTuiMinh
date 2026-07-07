export const strongPasswordMessage = 'Mật khẩu phải dài 8-32 ký tự, có chữ hoa, số và ký tự đặc biệt';

export const getPasswordChecks = (value: string) => [
  { label: '8-32 ký tự', passed: value.length >= 8 && value.length <= 32 },
  { label: 'Chữ hoa', passed: /[A-Z]/.test(value) },
  { label: 'Số', passed: /\d/.test(value) },
  { label: 'Ký tự đặc biệt', passed: /[^A-Za-z0-9]/.test(value) },
];

export const isStrongPassword = (value: string) => getPasswordChecks(value).every((item) => item.passed);

export const getPasswordStrength = (value: string) => {
  const checks = getPasswordChecks(value);
  const score = checks.filter((item) => item.passed).length;

  return {
    checks,
    score,
    tone: score <= 1 ? 'bg-rose-500' : score < 4 ? 'bg-amber-500' : 'bg-emerald-500',
    label: score === 0 ? 'Chưa nhập mật khẩu' : score < 4 ? 'Chưa đủ mạnh' : 'Mật khẩu hợp lệ',
  };
};
