import { getSession } from "@/lib/auth";
import { MessageThread } from "@/components/dashboard/MessageThread";

export default async function CustomerMessageThreadPage({
  params,
}: PageProps<"/dashboard/customer/messages/[recipientId]">) {
  const { recipientId } = await params;
  const session = await getSession();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Messages</h1>
      <MessageThread recipientId={recipientId} selfUserId={session!.userId} />
    </div>
  );
}
