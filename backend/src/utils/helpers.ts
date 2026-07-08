export const isProduction = process.env.NODE_ENV === 'production';

export function generateToken(bytes = 48): string {
  const crypto = require('crypto');
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateOTP(length = 6): string {
  const crypto = require('crypto');
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

export function excludeFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
