"use client";

import { useState } from "react";
import Image from "next/image";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerPlayer: { id: string; name: string; avatarUrl: string | null };
}

interface Props {
  coachProfileId: string;
  reviews: Review[];
  canReview: boolean;
  existingReview: { id: string; rating: number; comment: string | null } | null;
  viewerPlayerId: string | null;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <svg className={`w-7 h-7 transition-colors ${s <= (hovered || value) ? "text-yellow-400" : "text-slate-600"}`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? "text-yellow-400" : "text-slate-600"}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export function ReviewSection({ coachProfileId, reviews: initial, canReview, existingReview, viewerPlayerId }: Props) {
  const [reviews, setReviews]   = useState(initial);
  const [editing, setEditing]   = useState(false);
  const [rating, setRating]     = useState(existingReview?.rating ?? 0);
  const [comment, setComment]   = useState(existingReview?.comment ?? "");
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function submit() {
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/coaches/${coachProfileId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      const saved = await res.json();
      setReviews((prev) => {
        const without = prev.filter((r) => r.reviewerPlayer.id !== viewerPlayerId);
        return [saved, ...without];
      });
      setEditing(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function remove() {
    setDeleting(true);
    try {
      await fetch(`/api/coaches/${coachProfileId}/reviews`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.reviewerPlayer.id !== viewerPlayerId));
      setRating(0);
      setComment("");
      setEditing(false);
    } finally { setDeleting(false); }
  }

  const myReview = reviews.find((r) => r.reviewerPlayer.id === viewerPlayerId);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {canReview && !editing && (
          <button
            onClick={() => { setEditing(true); setRating(myReview?.rating ?? 0); setComment(myReview?.comment ?? ""); setError(null); }}
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium"
          >
            {myReview ? "Edit your review" : "Leave a review"}
          </button>
        )}
      </div>

      {/* Write/edit form */}
      {editing && (
        <div className="mb-5 bg-slate-750 border border-slate-600 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-2">Your rating</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Comment <span className="text-slate-600">(optional)</span></p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience…"
              className="w-full bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
              {saving ? "Saving…" : "Submit"}
            </button>
            <button onClick={() => { setEditing(false); setError(null); }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold py-2 rounded-lg transition-colors">
              Cancel
            </button>
            {myReview && (
              <button onClick={remove} disabled={deleting}
                className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50">
                {deleting ? "…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          {canReview ? "Be the first to leave a review." : "No reviews yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 relative">
                {r.reviewerPlayer.avatarUrl ? (
                  <Image src={r.reviewerPlayer.avatarUrl} alt={r.reviewerPlayer.name} fill className="object-cover" sizes="32px" />
                ) : (
                  r.reviewerPlayer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-200">{r.reviewerPlayer.name}</span>
                  <StarDisplay rating={r.rating} />
                  <span className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-slate-400 mt-1 leading-relaxed">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
