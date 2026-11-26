import {
    LoginSchema,
    RegisterSchema,
    ProfileUpdateSchema,
    ChangePasswordSchema,
    MobileLoginSchema,
    MobileRegisterSchema,
} from '@learnaxia/shared';

describe('Shared Auth Validation Schema Contract Tests', () => {
    describe('LoginSchema / MobileLoginSchema', () => {
        it('should alias MobileLoginSchema directly to LoginSchema', () => {
            expect(MobileLoginSchema).toBe(LoginSchema);
        });

        it('should pass on valid credentials (including 6-char legacy passwords)', () => {
            const result = LoginSchema.safeParse({
                email: 'test@learnaxia.com',
                password: 'pass12',
            });
            expect(result.success).toBe(true);
        });

        it('should fail on invalid email format', () => {
            const result = LoginSchema.safeParse({
                email: 'not-an-email',
                password: 'password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Geçersiz e-posta formatı');
            }
        });

        it('should fail if password is shorter than 6 characters', () => {
            const result = LoginSchema.safeParse({
                email: 'test@learnaxia.com',
                password: '123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Şifre en az 6 karakter olmalıdır');
            }
        });
    });

    describe('RegisterSchema / MobileRegisterSchema', () => {
        it('should alias MobileRegisterSchema directly to RegisterSchema', () => {
            expect(MobileRegisterSchema).toBe(RegisterSchema);
        });

        it('should pass with required handle and omitted optional name', () => {
            const result = RegisterSchema.safeParse({
                handle: 'john_doe-1',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(true);
        });

        it('should pass with empty optional name or Turkish display name', () => {
            expect(
                RegisterSchema.safeParse({
                    handle: 'emre_sahin',
                    name: '',
                    email: 'emre@learnaxia.com',
                    password: 'securePassword123',
                }).success
            ).toBe(true);

            expect(
                RegisterSchema.safeParse({
                    handle: 'emre_sahin',
                    name: 'Emre Şahin-Öğüt',
                    email: 'emre@learnaxia.com',
                    password: 'securePassword123',
                }).success
            ).toBe(true);
        });

        it('should fail when handle is missing or shorter than 3 characters', () => {
            const missing = RegisterSchema.safeParse({
                name: 'John Doe',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(missing.success).toBe(false);

            const tooShort = RegisterSchema.safeParse({
                handle: 'ab',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(tooShort.success).toBe(false);
            if (!tooShort.success) {
                expect(tooShort.error.issues[0].message).toContain('Kullanıcı adı en az 3 karakter olmalıdır');
            }
        });

        it('should fail if optional name contains numbers or special symbols', () => {
            const result = RegisterSchema.safeParse({
                handle: 'john_doe',
                name: 'John Doe 123!',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('İsim boş bırakılabilir veya en az 2 harf içermelidir');
            }
        });

        it('should fail if handle contains invalid characters or spaces', () => {
            const result = RegisterSchema.safeParse({
                handle: 'john doe!',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Kullanıcı adı sadece harf, rakam, tire ve alt çizgi içerebilir');
            }
        });

        it('should require at least 8 characters for registration password', () => {
            const result = RegisterSchema.safeParse({
                handle: 'john_doe',
                email: 'john@learnaxia.com',
                password: '1234567',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Şifre en az 8 karakter olmalıdır');
            }
        });
    });

    describe('ProfileUpdateSchema & ChangePasswordSchema', () => {
        it('should allow clearing display name via null in ProfileUpdateSchema', () => {
            const result = ProfileUpdateSchema.safeParse({
                name: null,
                handle: 'updated_handle',
                language: 'tr',
            });
            expect(result.success).toBe(true);
        });

        it('should validate ChangePasswordSchema currentPassword and min-8 newPassword', () => {
            expect(
                ChangePasswordSchema.safeParse({
                    currentPassword: '',
                    newPassword: 'newSecurePassword1',
                }).success
            ).toBe(false);

            expect(
                ChangePasswordSchema.safeParse({
                    currentPassword: 'oldPassword',
                    newPassword: 'short',
                }).success
            ).toBe(false);

            expect(
                ChangePasswordSchema.safeParse({
                    currentPassword: 'oldPassword',
                    newPassword: 'newSecurePassword1',
                }).success
            ).toBe(true);
        });
    });
});
