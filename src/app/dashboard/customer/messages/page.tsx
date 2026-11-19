import { ConversationsList } from "@/components/dashboard/ConversationsList";

export default function CustomerMessagesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Messages</h1>
      <ConversationsList basePath="/dashboard/customer/messages" />
    </div>
  );
}
