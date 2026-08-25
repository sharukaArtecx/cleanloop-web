import ResourceManager from "@/components/admin/ResourceManager";

export const metadata = {
  title: "Resources — CleanLoop Admin",
};

export default function AdminResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-loop-950">
        Resource manager
      </h1>
      <p className="mt-1 text-sm text-loop-500">
        Track bins, trucks, and PPE — status, condition, and zone assignment.
      </p>

      <ResourceManager />
    </div>
  );
}