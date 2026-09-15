import { prisma } from "./prisma.service";

export interface CreatePatientInput {
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  age?: number;
  phone?: string;
}

export interface UpdatePatientInput {
  name?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  age?: number;
  phone?: string;
}

export async function createPatient(data: CreatePatientInput) {
  return prisma.patient.create({
    data: {
      name: data.name,
      gender: data.gender,
      age: data.age,
      phone: data.phone,
    },
  });
}

export async function getPatients() {
  return prisma.patient.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPatientById(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: {
      patientId,
    },
    include: {
      appointments: true,
    },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  return patient;
}

export async function updatePatient(
  patientId: string,
  data: UpdatePatientInput,
) {
  const existingPatient = await prisma.patient.findUnique({
    where: {
      patientId,
    },
  });

  if (!existingPatient) {
    throw new Error("Patient not found");
  }

  return prisma.patient.update({
    where: {
      patientId,
    },
    data,
  });
}

export async function deletePatient(patientId: string) {
  const existingPatient = await prisma.patient.findUnique({
    where: {
      patientId,
    },
  });

  if (!existingPatient) {
    throw new Error("Patient not found");
  }

  return prisma.patient.delete({
    where: {
      patientId,
    },
  });
}