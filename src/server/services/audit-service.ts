import prisma from "../../shared/lib/prisma.js";

export const logAction = async (data: {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: any;
  ip?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        ...data,
        userId: data.userId ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      }
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
};
