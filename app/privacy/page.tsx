import Link from "next/link";

export const metadata = { title: "Privacy Policy — HandiPick" };

export default function PrivacyPage() {
  const EFFECTIVE = "April 13, 2026";

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-teal-400 hover:text-teal-300 text-sm mb-6 inline-block">← Back</Link>

        <h1 className="text-3xl font-bold text-teal-400 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Effective date: {EFFECTIVE}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Account information: name, email address, password (hashed)</li>
              <li>Profile information: date of birth, gender, skill rating, club affiliation</li>
              <li>Match data: game results, scores, and rating changes you or other players submit</li>
              <li>Communications: emails and messages you send to us</li>
            </ul>
            <p className="mt-3">We also collect limited technical data automatically: IP address, browser type, and pages visited, for security and analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To operate and improve the Service (calculate ratings, display leaderboards)</li>
              <li>To send transactional emails (account security, password reset, match confirmations)</li>
              <li>To send rating updates, match notifications, and product news — <strong>only if you opt in</strong></li>
              <li>To share your player profile data with tournament directors and club organizers — <strong>only with your explicit consent</strong></li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">3. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data in these limited circumstances:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Tournament directors and club organizers:</strong> If you consent during registration, we may share your name, rating, and contact email to facilitate tournament seeding and club management.</li>
              <li><strong>Service providers:</strong> We use Vercel (hosting), Resend (email), and a cloud database provider. These processors handle data only as directed by us.</li>
              <li><strong>Legal requirements:</strong> We may disclose data if required by law, court order, or to protect the rights and safety of our users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">4. Public Information</h2>
            <p>Your name, player rating, and match history are visible to other registered users on the leaderboard and player profiles. If you want this information restricted, contact us to discuss account options.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">5. Data Retention</h2>
            <p>We retain your account and match data for as long as your account is active. If you request deletion, we will remove your personal information within 30 days, subject to legal retention requirements. Note that match records involving other players may be anonymized rather than deleted to preserve the integrity of those players&apos; ratings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">6. Your Rights</h2>
            <p>You may at any time:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Access or correct your personal information via your profile settings</li>
              <li>Opt out of marketing emails via the unsubscribe link in any email</li>
              <li>Withdraw data-sharing consent by contacting us</li>
              <li>Request deletion of your account and personal data</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:support@handipickle.com" className="text-teal-400 hover:underline">support@handipickle.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">7. Cookies</h2>
            <p>We use session cookies necessary for authentication. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">8. Children&apos;s Privacy</h2>
            <p>HandiPick is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has registered without parental consent, contact us and we will promptly delete the account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">9. Security</h2>
            <p>We use industry-standard measures including password hashing, encrypted connections (HTTPS), and access controls. No system is 100% secure — please use a strong, unique password and notify us immediately of any suspected breach.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you by email before material changes take effect. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">11. Contact</h2>
            <p>Questions about this policy? Email <a href="mailto:support@handipickle.com" className="text-teal-400 hover:underline">support@handipickle.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
