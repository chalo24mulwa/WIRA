import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { quotationSchema } from "@/lib/validators";
import { notify } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/requests/[id]/quotations">
) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!serviceRequest) throw new ApiError("Request not found.", 404);
    if (serviceRequest.status !== "OPEN" && serviceRequest.status !== "QUOTED") {
      throw new ApiError("This request is no longer accepting quotations.");
    }

    const existing = await prisma.quotation.findUnique({
      where: { requestId_professionalId: { requestId: id, professionalId: profile.id } },
    });
    if (existing) throw new ApiError("You have already quoted on this request.");

    const quotation = await prisma.quotation.create({
      data: {
        requestId: id,
        professionalId: profile.id,
        amount: parsed.data.amount,
        pricingMethod: parsed.data.pricingMethod,
        estimatedCompletion: parsed.data.estimatedCompletion || null,
        message: parsed.data.message || null,
      },
    });

    if (serviceRequest.status === "OPEN") {
      await prisma.serviceRequest.update({ where: { id }, data: { status: "QUOTED" } });
    }

    const priceLabel =
      parsed.data.pricingMethod === "PER_HOUR"
        ? `KSh ${parsed.data.amount.toLocaleString()} / Hour`
        : `KSh ${parsed.data.amount.toLocaleString()} / Job`;
    await notify(
      serviceRequest.customerId,
      "New quotation received",
      `A professional quoted ${priceLabel} for your service request.`,
      `/dashboard/customer/requests/${id}`,
      "new_quotation"
    );

    return NextResponse.json({ quotation });
  } catch (error) {
    return handleApiError(error);
  }
}
