import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { consumeCreditForBooking, InsufficientCreditsError } from "@/lib/credits";
import { notify } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/quotations/[id]/accept">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { request: true, professional: true },
    });
    if (!quotation) throw new ApiError("Quotation not found.", 404);
    if (quotation.request.customerId !== session.userId) {
      throw new ApiError("You do not have permission to do this.", 403);
    }
    if (quotation.request.status === "CONFIRMED") {
      throw new ApiError("This request already has a confirmed professional.");
    }
    if (quotation.status !== "PENDING") {
      throw new ApiError("This quotation is no longer available.");
    }

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          requestId: quotation.requestId,
          quotationId: quotation.id,
          professionalId: quotation.professionalId,
        },
      });

      await tx.quotation.update({
        where: { id: quotation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      await tx.quotation.updateMany({
        where: { requestId: quotation.requestId, id: { not: quotation.id }, status: "PENDING" },
        data: { status: "DECLINED" },
      });
      await tx.serviceRequest.update({
        where: { id: quotation.requestId },
        data: { status: "CONFIRMED" },
      });

      return created;
    });

    try {
      await consumeCreditForBooking(quotation.professionalId, booking.id);
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        // The booking stands (the customer already confirmed); flag it for the
        // professional to resolve via a plan upgrade rather than rolling back
        // a confirmation the customer has already made.
        await notify(
          quotation.professional.userId,
          "Booking confirmed — upgrade needed",
          "You have a new confirmed booking but have run out of credits this period. Upgrade your plan to keep receiving bookings.",
          "/dashboard/professional/subscription",
          "credits_exhausted"
        );
      } else {
        throw error;
      }
    }

    await notify(
      quotation.professional.userId,
      "Booking confirmed!",
      "A customer has confirmed your quotation. Their contact details are now visible on the booking.",
      "/dashboard/professional/bookings",
      "booking_confirmed"
    );

    await notify(
      session.userId,
      "Booking confirmed!",
      "You confirmed a professional for this job. Their contact details are now visible on the booking.",
      "/dashboard/customer/bookings",
      "booking_confirmed"
    );

    return NextResponse.json({ booking });
  } catch (error) {
    return handleApiError(error);
  }
}
