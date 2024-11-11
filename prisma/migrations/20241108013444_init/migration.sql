-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_userInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL DEFAULT '0',
    "name" TEXT NOT NULL,
    "auth" INTEGER NOT NULL,
    "discount" REAL NOT NULL,
    "money" REAL NOT NULL,
    "spent" REAL NOT NULL,
    "pc" INTEGER NOT NULL,
    "billing" BOOLEAN NOT NULL
);
INSERT INTO "new_userInfo" ("auth", "billing", "discount", "id", "money", "name", "pc", "spent") SELECT "auth", "billing", "discount", "id", "money", "name", "pc", "spent" FROM "userInfo";
DROP TABLE "userInfo";
ALTER TABLE "new_userInfo" RENAME TO "userInfo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
