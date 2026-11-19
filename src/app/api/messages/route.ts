import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireUser();

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    const conversations = await prisma.conversation.findMany({
      where: professional
        ? { professionalId: professional.id }
        : { employerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        hiringRequest: { select: { jobTitle: true } },
        professional: { select: { user: { select: { name: true } } } },
        employer: { select: { name: true, companyProfile: { select: { companyName: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        recipient: { select: { id: true } },
      },
    });

    const threads = await Promise.all(
      conversations.map(async (c) => {
        const unread = await prisma.message.count({
          where: { conversationId: c.id, senderId: { not: session.userId }, readAt: null },
        });
        return {
          recipientId: c.recipient.id,
          jobTitle: c.hiringRequest.jobTitle,
          otherParty: professional
            ? c.employer.companyProfile?.companyName ?? c.employer.name
            : c.professional.user.name,
          lastMessage: c.messages[0]?.body ?? null,
          lastMessageAt: c.messages[0]?.createdAt ?? c.createdAt,
          unread,
        };
      })
    );

    threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json({ threads });
  } catch (error) {
    return handleApiError(error);
  }
}
