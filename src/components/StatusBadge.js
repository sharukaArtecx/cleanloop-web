const STYLES = {
  open: "bg-clay-500/15 text-clay-600",
  in_progress: "bg-loop-100 text-loop-700",
  resolved: "bg-loop-700/15 text-loop-700",
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
