import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireUser();

    if (session.role === "CUSTOMER") {
      const bookings = await prisma.booking.findMany({
        where: { request: { customerId: session.userId } },
        orderBy: { createdAt: "desc" },
        include: {
          request: { include: { category: true } },
          quotation: true,
          professional: {
            include: { user: { select: { name: true, phone: true, email: true } } },
          },
          review: true,
        },
      });
      // Contact details are only ever meant for the two confirmed parties on
      // an active booking — redact them if the booking was ever cancelled.
      const redacted = bookings.map((b) =>
        b.status === "CANCELLED"
          ? { ...b, professional: { ...b.professional, user: { ...b.professional.user, phone: null, email: null } } }
          : b
      );
      return NextResponse.json({ bookings: redacted });
    }

    if (session.role === "PROFESSIONAL") {
      const profile = await prisma.professionalProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!profile) throw new ApiError("Professional profile not found.", 404);

      const bookings = await prisma.booking.findMany({
        where: { professionalId: profile.id },
        orderBy: { createdAt: "desc" },
        include: {
          request: {
            include: {
              category: true,
              customer: { select: { name: true, phone: true, email: true } },
            },
          },
          quotation: true,
          review: true,
        },
      });
      const redacted = bookings.map((b) =>
        b.status === "CANCELLED"
          ? { ...b, request: { ...b.request, customer: { ...b.request.customer, phone: null, email: null } } }
          : b
      );
      return NextResponse.json({ bookings: redacted });
    }

    return NextResponse.json({ bookings: [] });
  } catch (error) {
    return handleApiError(error);
  }
}
