import { z } from 'zod';

// Ortak parola politikası — Web ve Mobil aynı kuralı kullanmalı
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_ERROR = `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`;

export const MobileLoginSchema = z.object({
  email: z.string().email('Geçersiz e-posta formatı'),
  password: z.string().min(PASSWORD_MIN_LENGTH, PASSWORD_ERROR),
});

export const MobileRegisterSchema = z.object({
  // Ad Soyad — Türkçe karakterler ve boşluk serbesttir
  name: z.string()
    .min(2, 'Ad Soyad en az 2 karakter olmalıdır')
    .max(64, 'Ad Soyad en fazla 64 karakter olabilir')
    .regex(
      /^[\p{L}\p{M}\s'-]+$/u,
      'Ad Soyad yalnızca harf ve boşluk içerebilir'
    ),
  // Kullanıcı adı (handle) — Alfanumerik ve alt çizgi, opsiyonel
  handle: z.string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
    .max(24, 'Kullanıcı adı en fazla 24 karakter olabilir')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
    )
    .optional(),
  email: z.string().email('Geçersiz e-posta formatı'),
  password: z.string().min(PASSWORD_MIN_LENGTH, PASSWORD_ERROR),
});
