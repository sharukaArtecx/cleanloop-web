const STYLES = {
  open: "bg-amber-500/15 text-amber-800 border border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-800 border border-blue-500/30",
  resolved: "bg-loop-700/15 text-loop-700 border border-loop-700/30",
};

const LABELS = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status] || "bg-loop-100 text-loop-700"}`}>
      {LABELS[status] || status}
    </span>
  );
}
