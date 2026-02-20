import { Resend } from "resend";

const getResend = () => {
    const key = process.env.RESEND_API_KEY || "re_build_dummy_key";
    return new Resend(key);
};

export async function sendVerificationEmail(email: string, token: string) {
    const domain = process.env.AUTH_URL || "http://localhost:3000";
    const confirmLink = `${domain}/auth/verify?token=${token}`;

    console.log(`[Mail] Sending verification email to: ${email}`);

    try {
        const response = await getResend().emails.send({
            from: process.env.MAIL_FROM || "Learnaxia <no-reply@learnaxia.com>",
            to: email,
            subject: "Hesabınızı Aktifleştirin — Learnaxia",
            html: `
<div style="background-color: #050510; color: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; text-align: center; line-height: 1.5;">
  <div style="max-width: 500px; margin: 0 auto; background: #0f1120; border: 1px solid #1e293b; border-radius: 24px; padding: 48px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);">
    
    <!-- Branding -->
    <div style="margin-bottom: 32px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6, #d946ef); border-radius: 14px; margin-bottom: 16px;"></div>
      <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin: 0; color: #ffffff;">Learnaxia</h1>
    </div>

    <!-- Content -->
    <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #e2e8f0;">Yolculuğun Başlıyor!</h2>
    <p style="font-size: 15px; color: #94a3b8; margin-bottom: 32px; font-weight: 400;">
      Zihinsel sınırlarını aşmaya ve öğrenme sürecini yapay zeka ile profesyonelce yönetmeye bir adım kaldı. Hesabını doğrulamak için aşağıdaki butona tıkla.
    </p>

    <!-- Action -->
    <a href="${confirmLink}" 
       style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: #ffffff; padding: 16px 36px; border-radius: 16px; font-weight: 700; font-size: 16px; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3); transition: all 0.2s ease;">
      E-postamı Doğrula
    </a>

    <!-- Security Info -->
    <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #1e293b;">
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Güvenliğin için bu buton <strong>1 saat</strong> geçerlidir.<br>
        Eğer bu talebi sen yapmadıysan bu e-postayı görmezden gelebilirsin.
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 32px;">
    <p style="font-size: 12px; color: #475569; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600;">
      © ${new Date().getFullYear()} Learnaxia • Smart Learning Experience
    </p>
  </div>
</div>
            `,
        });

        if (response.error) {
            console.error("[Mail] Resend API Error:", response.error);
            throw new Error(response.error.message);
        }

        console.log("[Mail] Email sent successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("[Mail] Resend Error:", error);
        throw error;
    }
}
