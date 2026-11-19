import { WorkerEditForm } from "@/components/dashboard/WorkerEditForm";

export default async function WorkerEditPage({
  params,
}: PageProps<"/dashboard/professional/workers/[id]">) {
  const { id } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Edit Worker</h1>
      <WorkerEditForm workerId={id} />
    </div>
  );
}
