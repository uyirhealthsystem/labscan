CREATE TYPE "AppointmentPaymentStatus" AS ENUM (
  'CREATED',
  'PAID',
  'FAILED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TABLE "AppointmentPayment" (
  "paymentId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "razorpayPaymentLinkId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT,
  "status" "AppointmentPaymentStatus" NOT NULL DEFAULT 'CREATED',
  "amount" DECIMAL(65,30) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "checkoutUrl" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppointmentPayment_pkey" PRIMARY KEY ("paymentId")
);

CREATE TABLE "RazorpayWebhookEvent" (
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("eventId")
);

CREATE UNIQUE INDEX "AppointmentPayment_razorpayPaymentLinkId_key"
  ON "AppointmentPayment"("razorpayPaymentLinkId");

CREATE UNIQUE INDEX "AppointmentPayment_razorpayPaymentId_key"
  ON "AppointmentPayment"("razorpayPaymentId");

CREATE INDEX "AppointmentPayment_appointmentId_status_idx"
  ON "AppointmentPayment"("appointmentId", "status");

ALTER TABLE "AppointmentPayment"
  ADD CONSTRAINT "AppointmentPayment_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId")
  ON DELETE CASCADE ON UPDATE CASCADE;
