import { z } from 'zod';

export const MobileLoginSchema = z.object({
  email: z.string().email('Geçersiz e-posta formatı'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
});

export const MobileRegisterSchema = z.object({
  name: z.string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
    .regex(/^[a-zA-Z0-9_]+$/, 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir (boşluk kullanılamaz)'),
  email: z.string().email('Geçersiz e-posta formatı'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
});
