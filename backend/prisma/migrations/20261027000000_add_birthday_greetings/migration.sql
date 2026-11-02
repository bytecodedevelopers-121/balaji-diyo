-- CreateTable
CREATE TABLE "birthday_greetings_sent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birthday_greetings_sent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_optouts" (
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birthday_optouts_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "birthday_greetings_sent_email_year_key" ON "birthday_greetings_sent"("email", "year");
