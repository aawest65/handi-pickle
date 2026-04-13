import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "HandiPick <noreply@handipickle.com>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://www.handipickle.com";

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to:   email,
    subject: "Reset your HandiPick password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0f172a; color: #e2e8f0; border-radius: 12px;">
        <h1 style="color: #2dd4bf; font-size: 24px; margin: 0 0 8px;">HandiPick</h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 32px;">Pickleball Player Ratings</p>

        <h2 style="font-size: 20px; color: #f1f5f9; margin: 0 0 12px;">Password Reset Request</h2>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
          We received a request to reset the password for your account. Click the button below to choose a new password.
          This link expires in <strong style="color: #e2e8f0;">24 hours</strong>.
        </p>

        <a href="${resetUrl}"
           style="display: inline-block; background: #0d9488; color: #ffffff; font-weight: 600; font-size: 15px;
                  padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-bottom: 28px;">
          Reset Password
        </a>

        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
          If you didn't request a password reset, you can safely ignore this email — your password won't change.
        </p>
        <p style="color: #475569; font-size: 12px; margin: 0;">
          Or copy this link into your browser:<br/>
          <span style="color: #2dd4bf; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `,
  });
}
