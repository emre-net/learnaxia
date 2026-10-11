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

        it('should fail if password is shorter than 8 characters', () => {
            const result = MobileLoginSchema.safeParse({
                email: 'test@learnaxia.com',
                password: '123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Şifre en az 8 karakter olmalıdır');
            }
        });
    });

    describe('MobileRegisterSchema', () => {
        it('should pass on valid registration data', () => {
            const result = MobileRegisterSchema.safeParse({
                name: 'john_doe',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(true);
        });

        it('should fail if username contains spaces or special characters', () => {
            const result = MobileRegisterSchema.safeParse({
                name: 'john doe!',
                email: 'john@learnaxia.com',
                password: 'securePassword123',
            });
            expect(result.success).toBe(false);
        });
    });
});
