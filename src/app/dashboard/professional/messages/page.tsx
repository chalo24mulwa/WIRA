import { ConversationsList } from "@/components/dashboard/ConversationsList";

export default function ProfessionalMessagesPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Messages</h1>
      <ConversationsList basePath="/dashboard/professional/messages" />
    </div>
  );
}
