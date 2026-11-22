import { MobileLoginSchema, MobileRegisterSchema } from '@learnaxia/shared';

describe('Shared Auth Validation Schema Contract Tests', () => {
    describe('MobileLoginSchema', () => {
        it('should pass on valid credentials', () => {
            const result = MobileLoginSchema.safeParse({
                email: 'test@learnaxia.com',
                password: 'password123',
            });
            expect(result.success).toBe(true);
        });

        it('should fail on invalid email format', () => {
            const result = MobileLoginSchema.safeParse({
                email: 'not-an-email',
                password: 'password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Geçersiz e-posta formatı');
            }
        });

        it('should fail if password is shorter than 6 characters', () => {
            const result = MobileLoginSchema.safeParse({
                email: 'test@learnaxia.com',
                password: '123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Şifre en az 6 karakter olmalıdır');
            }
        });
    });

    describe('MobileRegisterSchema', () => {
        it('should pass on valid registration data with name and optional handle', () => {
            const result = MobileRegisterSchema.safeParse({
                name: 'John Doe',
                handle: 'john_doe',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(true);
        });

        it('should fail if name contains special characters or numbers', () => {
            const result = MobileRegisterSchema.safeParse({
                name: 'John Doe 123!',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Ad Soyad yalnızca harf ve boşluk içerebilir');
            }
        });

        it('should fail if handle contains invalid characters or spaces', () => {
            const result = MobileRegisterSchema.safeParse({
                name: 'John Doe',
                handle: 'john doe!',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
            }
        });
    });
});
