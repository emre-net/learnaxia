import { z } from 'zod';

export const MobileLoginSchema = z.object({
  email: z.string().email('Geçersiz e-posta formatı'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

export const MobileRegisterSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçersiz e-posta formatı'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});
