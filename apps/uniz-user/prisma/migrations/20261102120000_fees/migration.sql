-- Additive only: fee structures, invoices, payments.
CREATE TABLE IF NOT EXISTS "FeeStructure" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "batch" TEXT NOT NULL DEFAULT '',
    "branch" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "items" JSONB NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FeeStructure_academicYear_idx" ON "FeeStructure"("academicYear");

CREATE TABLE IF NOT EXISTS "FeeInvoice" (
    "id" UUID NOT NULL,
    "studentId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "structureId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "paidPaise" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'due',
    "dueDate" DATE NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeeInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FeeInvoice_username_structureId_key" ON "FeeInvoice"("username", "structureId");
CREATE INDEX IF NOT EXISTS "FeeInvoice_status_idx" ON "FeeInvoice"("status");
CREATE INDEX IF NOT EXISTS "FeeInvoice_structureId_idx" ON "FeeInvoice"("structureId");

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_method_reference_key" ON "Payment"("method", "reference");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_username_idx" ON "Payment"("username");
