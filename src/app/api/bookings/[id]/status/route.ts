import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { notify } from "@/lib/notify";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/bookings/[id]/status">
) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const nextStatus = body?.status;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!booking || booking.professionalId !== profile.id) {
      throw new ApiError("Booking not found.", 404);
    }

    const allowed = ALLOWED_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ApiError(`Cannot move booking from ${booking.status} to ${nextStatus}.`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({ where: { id }, data: { status: nextStatus } });
      if (nextStatus === "COMPLETED") {
        await tx.serviceRequest.update({
          where: { id: booking.requestId },
          data: { status: "COMPLETED" },
        });
      }
      return b;
    });

    await notify(
      booking.request.customerId,
      "Booking update",
      `Your booking is now ${nextStatus.replace("_", " ").toLowerCase()}.`,
      `/dashboard/customer/bookings`,
      "booking_status"
    );

    return NextResponse.json({ booking: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
