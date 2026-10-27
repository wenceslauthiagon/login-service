/*
  Warnings:

  - Made the column `document` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    "updated_at" DATETIME,
    "reset_token" TEXT,
    "reset_token_expires" DATETIME
);
INSERT INTO "new_User" ("active", "created_at", "deleted_at", "document", "email", "id", "name", "password", "reset_token", "reset_token_expires", "updated_at") SELECT "active", "created_at", "deleted_at", "document", "email", "id", "name", "password", "reset_token", "reset_token_expires", "updated_at" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_document_key" ON "User"("document");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_name_idx" ON "User"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
