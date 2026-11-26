import { z } from 'zod';

/**
 * Ortak Parola ve Kimlik Doğrulama Sözleşmesi — Web ve Mobil tek kaynak.
 * Register & şifre yenileme en az 8 karakter; Login geriye dönük uyumluluk için en az 6 karakter.
 */
export const PASSWORD_LOGIN_MIN_LENGTH = 6;
export const PASSWORD_REGISTER_MIN_LENGTH = 8;

const HANDLE_REGEX = /^[a-zA-Z0-9_-]+$/;
const NAME_REGEX = /^[\p{L}\p{M}\s'-]+$/u;

export const OptionalDisplayNameSchema = z
  .string()
  .max(64, 'İsim en fazla 64 karakter olabilir')
  .refine(
    (val) => {
      const trimmed = val.trim();
      return trimmed.length === 0 || (trimmed.length >= 2 && NAME_REGEX.test(trimmed));
    },
    'İsim boş bırakılabilir veya en az 2 harf içermelidir'
  )
  .optional();

export const HandleSchema = z
  .string()
  .trim()
  .min(3, 'Kullanıcı adı en az 3 karakter olmalıdır')
  .max(24, 'Kullanıcı adı en fazla 24 karakter olabilir')
  .regex(HANDLE_REGEX, 'Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir');

export const RegisterPasswordSchema = z
  .string()
  .min(
    PASSWORD_REGISTER_MIN_LENGTH,
    `Şifre en az ${PASSWORD_REGISTER_MIN_LENGTH} karakter olmalıdır`
  )
  .max(128, 'Şifre en fazla 128 karakter olabilir');

export const LoginSchema = z.object({
  email: z.string().trim().email('Geçersiz e-posta formatı'),
  password: z
    .string()
    .min(
      PASSWORD_LOGIN_MIN_LENGTH,
      `Şifre en az ${PASSWORD_LOGIN_MIN_LENGTH} karakter olmalıdır`
    ),
});

export const RegisterSchema = z.object({
  // Zorunlu benzersiz kullanıcı adı (@handle)
  handle: HandleSchema,
  // İsteğe bağlı görünen isim (Ad veya Ad Soyad — Türkçe karakter ve boşluk serbest)
  name: OptionalDisplayNameSchema,
  email: z.string().trim().email('Geçersiz e-posta formatı'),
  password: RegisterPasswordSchema,
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Geçersiz e-posta formatı'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Sıfırlama anahtarı geçersiz'),
  password: RegisterPasswordSchema,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifrenizi girin'),
  newPassword: RegisterPasswordSchema,
});

export const ProfileUpdateSchema = z.object({
  name: OptionalDisplayNameSchema.nullable(),
  handle: HandleSchema.optional(),
  image: z
    .string()
    .url('Geçersiz profil resmi URL formatı')
    .optional()
    .or(z.literal(''))
    .nullable(),
  language: z.enum(['tr', 'en']).optional(),
});

// Geriye dönük uyumlu alias isimleri
export const MobileLoginSchema = LoginSchema;
export const MobileRegisterSchema = RegisterSchema;
export const MobileProfileUpdateSchema = ProfileUpdateSchema;

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
