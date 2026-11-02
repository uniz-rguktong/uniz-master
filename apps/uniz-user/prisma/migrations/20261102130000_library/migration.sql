-- Additive only: library catalogue, copies, loans, fines.
CREATE TABLE IF NOT EXISTS "Book" (
    "id" UUID NOT NULL,
    "isbn" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT '',
    "publisher" TEXT NOT NULL DEFAULT '',
    "year" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Book_isbn_idx" ON "Book"("isbn");
CREATE INDEX IF NOT EXISTS "Book_title_idx" ON "Book"("title");

CREATE TABLE IF NOT EXISTS "BookCopy" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "barcode" TEXT NOT NULL,
    "shelf" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BookCopy_barcode_key" ON "BookCopy"("barcode");
CREATE INDEX IF NOT EXISTS "BookCopy_bookId_idx" ON "BookCopy"("bookId");

CREATE TABLE IF NOT EXISTS "Loan" (
    "id" UUID NOT NULL,
    "copyId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "borrowerUsername" TEXT NOT NULL,
    "borrowerType" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "issuedBy" TEXT NOT NULL,
    "returnedTo" TEXT,
    "remindedAt" TIMESTAMP(3),
    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Loan_borrowerUsername_idx" ON "Loan"("borrowerUsername");
CREATE INDEX IF NOT EXISTS "Loan_copyId_idx" ON "Loan"("copyId");
CREATE INDEX IF NOT EXISTS "Loan_returnedAt_dueDate_idx" ON "Loan"("returnedAt", "dueDate");

CREATE TABLE IF NOT EXISTS "LibraryFine" (
    "id" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LibraryFine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "LibraryFine_loanId_key" ON "LibraryFine"("loanId");
CREATE INDEX IF NOT EXISTS "LibraryFine_username_idx" ON "LibraryFine"("username");
CREATE INDEX IF NOT EXISTS "LibraryFine_status_idx" ON "LibraryFine"("status");
