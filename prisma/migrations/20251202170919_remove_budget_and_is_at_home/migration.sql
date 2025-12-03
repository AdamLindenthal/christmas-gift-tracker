/*
  Warnings:

  - You are about to drop the column `isAtHome` on the `Gift` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `Person` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Gift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "url" TEXT,
    "notes" TEXT,
    "personId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gift_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Gift" ("createdAt", "description", "id", "name", "notes", "personId", "price", "status", "updatedAt", "url") SELECT "createdAt", "description", "id", "name", "notes", "personId", "price", "status", "updatedAt", "url" FROM "Gift";
DROP TABLE "Gift";
ALTER TABLE "new_Gift" RENAME TO "Gift";
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Person" ("createdAt", "id", "name", "relation", "updatedAt") SELECT "createdAt", "id", "name", "relation", "updatedAt" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
