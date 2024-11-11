-- CreateTable
CREATE TABLE "whitelist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "userInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "auth" INTEGER NOT NULL,
    "discount" REAL NOT NULL,
    "money" REAL NOT NULL,
    "spent" REAL NOT NULL,
    "pc" INTEGER NOT NULL,
    "billing" BOOLEAN NOT NULL
);
