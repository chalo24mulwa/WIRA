import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { reviewSchema } from "@/lib/validators";
import { notify } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/bookings/[id]/review">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { request: true, review: true },
    });
    if (!booking || booking.request.customerId !== session.userId) {
      throw new ApiError("Booking not found.", 404);
    }
    if (booking.status !== "COMPLETED") {
      throw new ApiError("You can only review a completed job.");
    }
    if (booking.review) {
      throw new ApiError("You have already reviewed this booking.");
    }

    const { rating, comment } = parsed.data;

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          bookingId: id,
          professionalId: booking.professionalId,
          customerId: session.userId,
          rating,
          comment: comment || null,
        },
      });

      const stats = await tx.review.aggregate({
        where: { professionalId: booking.professionalId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.professionalProfile.update({
        where: { id: booking.professionalId },
        data: {
          ratingAvg: stats._avg.rating ?? rating,
          ratingCount: stats._count.rating,
        },
      });

      return createdReview;
    });

    const professional = await prisma.professionalProfile.findUnique({
      where: { id: booking.professionalId },
    });
    if (professional) {
      await notify(
        professional.userId,
        "New review received",
        `You received a ${rating}-star review.`,
        `/dashboard/professional`,
        "new_review"
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    return handleApiError(error);
  }
}
