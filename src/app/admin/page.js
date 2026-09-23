"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";

const TYPE_LABELS = {
  missed_collection: "Missed collection",
  illegal_dumping: "Illegal dumping",
  hazard: "Hazard",
  other: "Other",
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AdminPage() {
  const [complaints, setComplaints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [scheduleForm, setScheduleForm] = useState({
    zone: "",
    dayOfWeek: "Monday",
    wasteType: "general",
  });
  const [scheduleMsg, setScheduleMsg] = useState("");

  async function loadComplaints() {
    const res = await fetch("/api/complaints");
    const data = await res.json();
    setComplaints(data.complaints || []);
  }

  async function loadEmployees() {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error("Failed to load employees", e);
    }
  }

  useEffect(() => {
    loadComplaints();
    loadEmployees();
  }, []);

  async function updateComplaint(id, updates) {
    await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    loadComplaints();
  }

  async function handleScheduleSubmit(e) {
    e.preventDefault();
    setScheduleMsg("");
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scheduleForm),
    });
    if (res.ok) {
      setScheduleMsg("Schedule published.");
      setScheduleForm({ zone: "", dayOfWeek: "Monday", wasteType: "general" });
    } else {
      const data = await res.json();
      setScheduleMsg(data.error || "Could not publish schedule.");
    }
  }

  const openCount = complaints.filter((c) => c.status !== "resolved").length;

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = c.description?.toLowerCase().includes(q);
      const zoneMatch = c.zone?.toLowerCase().includes(q);
      const reporterMatch = c.reportedBy?.name?.toLowerCase().includes(q);
      const assigneeMatch = c.assignedTo?.name?.toLowerCase().includes(q);
      if (!descMatch && !zoneMatch && !reporterMatch && !assigneeMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* --- Quick links --- */}
      <section>
        <div className="card flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-loop-950">
              Resource manager
            </h2>
            <p className="text-sm text-loop-700">
              Track bins, trucks, and PPE — status, condition, and zone assignment.
            </p>
          </div>
          <Link href="/admin/resources" className="btn-primary shrink-0">
            Open
          </Link>
        </div>
      </section>

      {/* --- Complaint Queue --- */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-loop-950">
              Complaint Queue ({openCount} open)
            </h2>
            <p className="text-xs text-loop-500">
              Review, assign workers, and update resolution statuses across wards.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4 p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search complaints by description, zone, reporter, or worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input text-xs py-2"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="field-input text-xs py-2 w-32"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="field-input text-xs py-2 w-36"
            >
              <option value="all">All Types</option>
              <option value="missed_collection">Missed collection</option>
              <option value="illegal_dumping">Illegal dumping</option>
              <option value="hazard">Hazard</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Complaints list */}
        <div className="space-y-3">
          {filteredComplaints.map((c) => (
            <div key={c._id} className="card space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-loop-900">
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-loop-100 text-loop-700 capitalize">
                      {c.source} report
                    </span>
                    {c.zone && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-900">
                        Zone: {c.zone}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-loop-800">{c.description}</p>

                  <div className="text-xs text-loop-500 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <span>
                      Reported by: <strong>{c.reportedBy?.name || "Unknown"}</strong> ({c.reportedBy?.role || "user"})
                    </span>
                    <span>&middot;</span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                    {c.resolvedAt && (
                      <>
                        <span>&middot;</span>
                        <span className="text-loop-700">
                          Resolved: {new Date(c.resolvedAt).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <StatusBadge status={c.status} />
              </div>

              <div className="pt-2 border-t border-loop-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Worker Assignment */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-loop-700 whitespace-nowrap">
                    Assigned Worker:
                  </span>
                  <select
                    value={c.assignedTo?._id || ""}
                    onChange={(e) =>
                      updateComplaint(c._id, { assignedTo: e.target.value || null })
                    }
                    className="field-input text-xs py-1 px-2.5 max-w-[200px]"
                  >
                    <option value="">-- Unassigned --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5">
                  {["open", "in_progress", "resolved"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateComplaint(c._id, { status: s })}
                      disabled={c.status === s}
                      className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                    >
                      {s === "open" ? "Open" : s === "in_progress" ? "In Progress" : "Resolve"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredComplaints.length === 0 && (
            <p className="card text-sm text-loop-700 text-center py-8">
              No complaints match the selected filters.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-base font-semibold text-loop-950 mb-3">
          Publish a collection schedule
        </h2>
        <form onSubmit={handleScheduleSubmit} className="card space-y-4 max-w-md">
          <div>
            <label className="field-label" htmlFor="zone">
              Zone / ward
            </label>
            <input
              id="zone"
              required
              className="field-input"
              value={scheduleForm.zone}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, zone: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label" htmlFor="dayOfWeek">
              Collection day
            </label>
            <select
              id="dayOfWeek"
              className="field-input"
              value={scheduleForm.dayOfWeek}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, dayOfWeek: e.target.value }))
              }
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="wasteType">
              Waste type
            </label>
            <select
              id="wasteType"
              className="field-input"
              value={scheduleForm.wasteType}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, wasteType: e.target.value }))
              }
            >
              <option value="general">General</option>
              <option value="recycling">Recycling</option>
              <option value="organic">Organic</option>
            </select>
          </div>
          {scheduleMsg && <p className="text-sm text-loop-700">{scheduleMsg}</p>}
          <button type="submit" className="btn-primary">
            Publish schedule
          </button>
        </form>
      </section>
    </div>
  );
}