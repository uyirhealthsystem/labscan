import { prisma } from "./prisma.service";

export interface CreateSupportTicketInput {
  labId?: string;
  scanCenterId?: string;
  subject: string;
  description: string;
  category?:
    | "BOOKING"
    | "REPORT"
    | "PAYMENT"
    | "TECHNICAL"
    | "ACCOUNT"
    | "OTHER";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

const validateProvider = async (
  labId?: string,
  scanCenterId?: string,
) => {
  if (!labId && !scanCenterId) {
    throw new Error("Either labId or scanCenterId is required");
  }

  if (labId && scanCenterId) {
    throw new Error("Provide either labId or scanCenterId, not both");
  }

  if (labId) {
    const lab = await prisma.lab.findUnique({
      where: {
        labId,
      },
    });

    if (!lab) {
      throw new Error("Lab not found");
    }

    return;
  }

  const scanCenter = await prisma.scanCenter.findUnique({
    where: {
      scanCenterId: scanCenterId!,
    },
  });

  if (!scanCenter) {
    throw new Error("Scan center not found");
  }
};

export const createSupportTicket = async (
  data: CreateSupportTicketInput,
) => {
  await validateProvider(
    data.labId,
    data.scanCenterId,
  );

  if (!data.subject?.trim()) {
    throw new Error("Subject is required");
  }

  if (!data.description?.trim()) {
    throw new Error("Description is required");
  }

  return prisma.supportTicket.create({
    data: {
      labId: data.labId,
      scanCenterId: data.scanCenterId,
      subject: data.subject.trim(),
      description: data.description.trim(),
      category: data.category ?? "OTHER",
      priority: data.priority ?? "MEDIUM",
    },
  });
};

export const getSupportTickets = async (
  labId?: string,
  scanCenterId?: string,
) => {
  await validateProvider(labId, scanCenterId);

  return prisma.supportTicket.findMany({
    where: labId
      ? { labId }
      : { scanCenterId },
    orderBy: {
      createdAt: "desc",
    },
  });
};