import { prisma } from "@/lib/prisma";

export async function notify(
  userId: string,
  title: string,
  body: string,
  link?: string,
  type: string = "general"
) {
  return prisma.notification.create({
    data: { userId, title, body, link, type },
  });
}
