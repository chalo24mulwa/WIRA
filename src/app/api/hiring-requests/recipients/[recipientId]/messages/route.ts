import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";
import { notify } from "@/lib/notify";
import type { SessionPayload } from "@/lib/auth";

async function loadAuthorizedRecipient(recipientId: string, session: SessionPayload) {
  const recipient = await prisma.hiringRequestRecipient.findUnique({
    where: { id: recipientId },
    include: {
      hiringRequest: { select: { id: true, employerId: true, jobTitle: true } },
      professional: { select: { id: true, userId: true } },
    },
  });
  if (!recipient) throw new ApiError("Hiring invitation not found.", 404);

  const isEmployer = recipient.hiringRequest.employerId === session.userId;
  const isProfessional = recipient.professional.userId === session.userId;
  if (!isEmployer && !isProfessional) {
    throw new ApiError("You do not have permission to view this conversation.", 403);
  }

  return { recipient, isEmployer };
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/hiring-requests/recipients/[recipientId]/messages">
) {
  try {
    const session = await requireUser();
    const { recipientId } = await params;
    const { recipient } = await loadAuthorizedRecipient(recipientId, session);

    const conversation = await prisma.conversation.findUnique({
      where: { recipientId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (conversation) {
      await prisma.message.updateMany({
        where: { conversationId: conversation.id, senderId: { not: session.userId }, readAt: null },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({
      jobTitle: recipient.hiringRequest.jobTitle,
      messages: conversation?.messages ?? [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/hiring-requests/recipients/[recipientId]/messages">
) {
  try {
    const session = await requireUser();
    const { recipientId } = await params;
    const body = await request.json().catch(() => null);
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!text) throw new ApiError("Message cannot be empty.");
    if (text.length > 2000) throw new ApiError("Message is too long.");

    const { recipient, isEmployer } = await loadAuthorizedRecipient(recipientId, session);

    const conversation = await prisma.conversation.upsert({
      where: { recipientId },
      update: {},
      create: {
        recipientId,
        hiringRequestId: recipient.hiringRequest.id,
        professionalId: recipient.professional.id,
        employerId: recipient.hiringRequest.employerId,
      },
    });

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: session.userId, body: text },
    });

    const recipientUserId = isEmployer ? recipient.professional.userId : recipient.hiringRequest.employerId;
    await notify(
      recipientUserId,
      "New message",
      `${session.name}: ${text.slice(0, 80)}`,
      isEmployer
        ? `/dashboard/professional/messages/${recipientId}`
        : `/dashboard/customer/messages/${recipientId}`,
      "new_message"
    );

    return NextResponse.json({ message });
  } catch (error) {
    return handleApiError(error);
  }
}
