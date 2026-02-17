import { Resend } from "resend";

const getResend = () => new Resend(process.env.MAILER_SECRET_KEY || "re_build_dummy_key");

export async function sendVerificationEmail(email: string, token: string) {
    const domain = process.env.AUTH_URL || "http://localhost:3000";
    const confirmLink = `${domain}/auth/verify?token=${token}`;

    await getResend().emails.send({
        from: "Learnaxia <onboarding@resend.dev>",
        to: email,
        subject: "E-posta Adresinizi Doğrulayın — Learnaxia",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f23; color: #e2e8f0; border-radius: 12px;">
                <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 8px;">Learnaxia'ya Hoş Geldiniz!</h1>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                    Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
                </p>
                <a href="${confirmLink}" 
                   style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: linear-gradient(135deg, #7c3aed, #a78bfa); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                    E-postamı Doğrula
                </a>
                <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                    Bu link 1 saat geçerlidir. Eğer bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz.
                </p>
            </div>
        `,
    });
}
