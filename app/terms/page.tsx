import Link from "next/link";

export const metadata = { title: "Terms of Service — HandiPick" };

export default function TermsPage() {
  const EFFECTIVE = "April 13, 2026";

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-teal-400 hover:text-teal-300 text-sm mb-6 inline-block">← Back</Link>

        <h1 className="text-3xl font-bold text-teal-400 mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Effective date: {EFFECTIVE}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">1. Acceptance of Terms</h2>
            <p>By creating an account or using HandiPick (&quot;the Service&quot;), you agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-teal-400 hover:underline">Privacy Policy</Link>. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">2. Description of Service</h2>
            <p>HandiPick is a pickleball player rating and match tracking platform. We calculate player ratings based on reported match results and make those ratings visible to other users and, where you consent, to tournament directors and club organizers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">3. Eligibility</h2>
            <p>You must be at least 13 years of age to use the Service. By registering, you represent that you meet this requirement. If you are under 18, you represent that a parent or guardian has reviewed and agreed to these Terms on your behalf.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">4. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate, current, and complete information at registration and to keep it updated.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">5. User Conduct</h2>
            <p>You agree not to: (a) submit false or fraudulent match results; (b) impersonate another person; (c) use the Service for any unlawful purpose; (d) attempt to reverse-engineer, scrape, or disrupt the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">6. Data and Ratings</h2>
            <p>Match results and ratings you submit become part of the HandiPick platform. We may use aggregate, anonymized data for research, product improvement, and promotional purposes. Individual player ratings may be shared with tournament directors and club organizers as described in the Privacy Policy and as you separately consent during registration.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">7. Communications</h2>
            <p>By creating an account you agree to receive transactional emails (account security, password reset, match confirmations). Marketing and rating-update emails are optional and controlled by your notification preferences.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">8. Intellectual Property</h2>
            <p>All content, logos, and software comprising the Service are owned by HandiPick or its licensors. You may not reproduce or distribute any part of the Service without written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">9. Disclaimers</h2>
            <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. HANDIPICK DOES NOT GUARANTEE THE ACCURACY OF RATINGS OR MATCH DATA SUBMITTED BY USERS.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">10. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, HANDIPICK SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">11. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe are being used fraudulently. You may delete your account at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">12. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you by email or in-app notice before material changes take effect. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">13. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States. Any disputes shall be resolved in the courts of competent jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">14. Contact</h2>
            <p>Questions about these Terms? Email us at <a href="mailto:support@handipickle.com" className="text-teal-400 hover:underline">support@handipickle.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
