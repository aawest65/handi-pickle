"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Club { id: string; name: string; }

const INPUT    = "w-full bg-slate-800 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500";
const BTN_GHOST = "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors";

export default function BroadcastPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isClubAdmin = session?.user?.isClubAdmin ?? false;
  const canBroadcast = isAdmin || isClubAdmin;

  const [clubs, setClubs] = useState<Club[]>([]);
  const [audienceType, setAudienceType] = useState<"all" | "club">("all");
  const [clubId, setClubId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && !canBroadcast)) {
      router.push("/");
    }
  }, [status, canBroadcast, router]);

  useEffect(() => {
    if (!canBroadcast) return;
    fetch("/api/admin/clubs")
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setClubs(list);
        // Club admins go straight to club mode with their first club pre-selected
        if (!isAdmin && list.length > 0) {
          setAudienceType("club");
          setClubId(list[0].id);
        }
      });
  }, [canBroadcast, isAdmin]);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setError("Subject and body are required."); return; }
    if (audienceType === "club" && !clubId) { setError("Pick a club."); return; }
    if (!confirmed) { setError("Check the confirmation box first."); return; }

    setSending(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: subject.trim(), body: body.trim(), audienceType, clubId: clubId || undefined }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setResult(data);
    setConfirmed(false);
  }

  if (status === "loading" || !canBroadcast) return null;

  const audienceLabel =
    audienceType === "all"
      ? "all registered players with email consent"
      : clubs.find((c) => c.id === clubId)?.name
        ? `all members of ${clubs.find((c) => c.id === clubId)!.name}`
        : "the selected club";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className={BTN_GHOST}>← Admin</Link>
        <h1 className="text-xl font-bold text-slate-100">Broadcast Email</h1>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5">

        {/* Audience */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audience</label>
          {isAdmin && (
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => { setAudienceType("all"); setClubId(""); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${audienceType === "all" ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                All players
              </button>
              <button
                onClick={() => setAudienceType("club")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${audienceType === "club" ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
              >
                Specific club
              </button>
            </div>
          )}
          {audienceType === "club" && (
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className={`${INPUT} mt-3`}
            >
              <option value="">— Select a club —</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Summer tournament registration is open"
            className={INPUT}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder={"Write your message here.\n\nBlank lines become paragraph breaks in the email."}
            className={`${INPUT} resize-y leading-relaxed`}
          />
          <p className="text-xs text-slate-500 mt-1">Plain text only. Blank lines = new paragraph.</p>
        </div>

        {/* Confirmation */}
        {subject.trim() && body.trim() && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-teal-500 h-4 w-4 shrink-0"
            />
            <span className="text-sm text-slate-300">
              I confirm I want to send this to <strong className="text-slate-100">{audienceLabel}</strong>.
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {result && (
          <div className="bg-slate-800 rounded-xl p-4">
            <p className="text-sm text-teal-400 font-semibold">
              Sent to {result.sent} recipient{result.sent !== 1 ? "s" : ""}
              {result.skipped > 0 && <span className="text-slate-500 font-normal"> · {result.skipped} skipped</span>}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-red-400 space-y-1">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !confirmed || !subject.trim() || !body.trim()}
          className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {sending ? "Sending…" : "Send Email"}
        </button>
      </div>
    </div>
  );
}
