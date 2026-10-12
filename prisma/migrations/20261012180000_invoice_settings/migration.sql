CREATE TABLE "InvoiceSettings" (
"id" INTEGER NOT NULL DEFAULT 1,
"businessName" TEXT NOT NULL DEFAULT 'UPZ Design LLC',
"address" TEXT NOT NULL DEFAULT '3623 30th Street, Astoria, NY 11106',
"email" TEXT NOT NULL DEFAULT 'info@upzdesign.com',
"phone" TEXT NOT NULL DEFAULT '347.596.9032',
"website" TEXT NOT NULL DEFAULT 'www.upzdesign.com',
"paymentInstructions" TEXT NOT NULL DEFAULT '',
"footerNote" TEXT NOT NULL DEFAULT 'Make all checks payable to: UPZ Design, LLC',
"logoSvg" TEXT,
"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);
