"use client";

import { useEffect, useState } from "react";

export default function VolunteerPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    zone: "",
    date: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rsvpingId, setRsvpingId] = useState(null);
  const [rsvpError, setRsvpError] = useState("");

  async function loadCampaigns() {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  }

  async function loadCurrentUser() {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    setCurrentUser(data.user || null);
  }

  useEffect(() => {
    loadCampaigns();
    loadCurrentUser();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Could not create campaign");
      return;
    }
    setForm({ title: "", description: "", zone: "", date: "" });
    loadCampaigns();
  }

  function isAttending(campaign) {
  if (!currentUser) return false;
  return campaign.attendees?.some((a) => a.user === currentUser.id);
}

function isOrganizer(campaign) {
  if (!currentUser) return false;
  return campaign.organizer === currentUser.id;
}

  async function handleRsvpToggle(campaign) {
    setRsvpError("");
    setRsvpingId(campaign._id);
    const method = isAttending(campaign) ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/campaigns/${campaign._id}/rsvp`, { method });
      const data = await res.json();
      if (!res.ok) {
        setRsvpError(data.error || "Could not update RSVP");
        return;
      }
      setCampaigns((prev) =>
        prev.map((c) => (c._id === campaign._id ? data.campaign : c))
      );
    } catch (err) {
      console.error("RSVP toggle error:", err);
      setRsvpError("Could not update RSVP");
    } finally {
      setRsvpingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-base font-semibold text-loop-950 mb-3">
          Organize a campaign
        </h2>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="field-label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              required
              className="field-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="field-input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="zone">
                Zone / ward
              </label>
              <input
                id="zone"
                className="field-input"
                value={form.zone}
                onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                required
                className="field-input"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          {error && <p className="text-sm text-clay-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Publishing..." : "Publish campaign"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-base font-semibold text-loop-950 mb-3">
          Upcoming campaigns
        </h2>
        {rsvpError && <p className="text-sm text-clay-600 mb-3">{rsvpError}</p>}
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c._id} className="card flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-loop-900">{c.title}</p>
                {c.description && (
                  <p className="text-sm text-loop-700">{c.description}</p>
                )}
                <p className="mt-1 text-xs text-loop-500">
                  {c.zone ? `${c.zone} · ` : ""}
                  {new Date(c.date).toLocaleDateString()}
                </p>
                <p className="mt-1 text-xs text-loop-500">
                  {c.attendees?.length || 0} attending
                </p>
              </div>
              {!isOrganizer(c) && currentUser && (
                <button
                  type="button"
                  onClick={() => handleRsvpToggle(c)}
                  disabled={rsvpingId === c._id}
                  className={isAttending(c) ? "btn-secondary" : "btn-primary"}
                >
                  {rsvpingId === c._id
                    ? "..."
                    : isAttending(c)
                    ? "Cancel RSVP"
                    : "I'm coming"}
                </button>
              )}
            </div>
          ))}
          {campaigns.length === 0 && (
            <p className="card text-sm text-loop-700">No campaigns published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}