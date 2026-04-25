import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "HandiPick <noreply@handipickle.com>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://www.handipickle.com";

export interface DigestMover {
  name: string;
  delta: number;
  ratingAfter: number;
}

export interface DigestLeader {
  name: string;
  currentRating: number;
  gamesPlayed: number;
}

export interface DigestPlayerStats {
  gamesThisWeek: number;
  ratingChange: number;
  currentRating: number;
}

export interface ClubDigestPayload {
  clubName: string;
  totalGamesThisWeek: number;
  topMovers: DigestMover[];       // up to 5, sorted desc by delta
  leaderboard: DigestLeader[];    // top 10 by currentRating
  playerStats: DigestPlayerStats;
}

export async function sendAnnouncementEmail(
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => `<p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
        <h1 style="color:#2dd4bf;font-size:22px;margin:0 0 4px;">HandiPick</h1>
        <p style="color:#64748b;font-size:13px;margin:0 0 28px;">Pickleball Player Ratings</p>

        <h2 style="font-size:19px;color:#f1f5f9;margin:0 0 20px;">${subject}</h2>

        ${paragraphs}

        <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0 20px;" />
        <p style="color:#334155;font-size:12px;margin:0;">
          You're receiving this from HandiPick.
          <a href="${BASE_URL}/profile" style="color:#475569;">Manage notifications</a> in your profile.
        </p>
      </div>
    `,
  });
}

export async function sendClubDigestEmail(
  to: string,
  playerName: string,
  payload: ClubDigestPayload,
): Promise<void> {
  const { clubName, totalGamesThisWeek, topMovers, leaderboard, playerStats } = payload;

  const ratingSign = playerStats.ratingChange >= 0 ? "+" : "";
  const ratingColor = playerStats.ratingChange > 0 ? "#2dd4bf" : playerStats.ratingChange < 0 ? "#f87171" : "#94a3b8";

  const moverRows = topMovers.map((m, i) =>
    `<tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:13px;">${i + 1}.</td>
      <td style="padding:6px 8px;color:#e2e8f0;font-size:13px;">${m.name}</td>
      <td style="padding:6px 0;color:#2dd4bf;font-size:13px;text-align:right;">+${m.delta.toFixed(2)}</td>
      <td style="padding:6px 0 6px 8px;color:#64748b;font-size:12px;text-align:right;">${m.ratingAfter.toFixed(2)}</td>
    </tr>`
  ).join("");

  const leaderRows = leaderboard.map((p, i) =>
    `<tr>
      <td style="padding:6px 0;color:#94a3b8;font-size:13px;">${i + 1}.</td>
      <td style="padding:6px 8px;color:#e2e8f0;font-size:13px;">${p.name}</td>
      <td style="padding:6px 0;color:#2dd4bf;font-size:13px;text-align:right;">${p.currentRating.toFixed(2)}</td>
      <td style="padding:6px 0 6px 8px;color:#64748b;font-size:12px;text-align:right;">${p.gamesPlayed}g</td>
    </tr>`
  ).join("");

  const profileUrl = `${BASE_URL}/profile`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${clubName} weekly recap`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
        <h1 style="color:#2dd4bf;font-size:22px;margin:0 0 4px;">HandiPick</h1>
        <p style="color:#64748b;font-size:13px;margin:0 0 28px;">Weekly Club Digest</p>

        <h2 style="font-size:18px;color:#f1f5f9;margin:0 0 4px;">${clubName}</h2>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
          Hi ${playerName} — here's what happened at your club this week.
          ${totalGamesThisWeek === 0
            ? "No games were recorded this week."
            : `<strong style="color:#e2e8f0;">${totalGamesThisWeek}</strong> game${totalGamesThisWeek !== 1 ? "s" : ""} recorded.`
          }
        </p>

        <!-- Player's own stats -->
        <div style="background:#1e293b;border-radius:10px;padding:16px;margin-bottom:24px;">
          <p style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px;">Your week</p>
          <div style="display:flex;gap:24px;">
            <div>
              <p style="font-size:24px;font-weight:700;color:#f1f5f9;margin:0;">${playerStats.gamesThisWeek}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">games</p>
            </div>
            <div>
              <p style="font-size:24px;font-weight:700;color:${ratingColor};margin:0;">${ratingSign}${playerStats.ratingChange.toFixed(2)}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">rating change</p>
            </div>
            <div>
              <p style="font-size:24px;font-weight:700;color:#e2e8f0;margin:0;">${playerStats.currentRating.toFixed(2)}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">current rating</p>
            </div>
          </div>
        </div>

        ${topMovers.length > 0 ? `
        <!-- Top movers -->
        <div style="margin-bottom:24px;">
          <p style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px;">Top movers this week</p>
          <table style="width:100%;border-collapse:collapse;">
            ${moverRows}
          </table>
        </div>
        ` : ""}

        <!-- Leaderboard -->
        <div style="margin-bottom:28px;">
          <p style="font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px;">Club leaderboard</p>
          <table style="width:100%;border-collapse:collapse;">
            ${leaderRows}
          </table>
        </div>

        <a href="${profileUrl}"
           style="display:inline-block;background:#0d9488;color:#ffffff;font-weight:600;font-size:14px;
                  padding:11px 24px;border-radius:8px;text-decoration:none;margin-bottom:28px;">
          View My Profile
        </a>

        <p style="color:#334155;font-size:12px;margin:0;">
          You're receiving this because you're a member of ${clubName} on HandiPick.
          <a href="${profileUrl}" style="color:#475569;">Unsubscribe</a> in your profile settings.
        </p>
      </div>
    `,
  });
}

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
