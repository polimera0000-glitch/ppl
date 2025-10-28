'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Works even if the table already exists; fixes enums, columns, defaults, and indexes.
    await queryInterface.sequelize.transaction(async (t) => {
      // 1) Ensure ENUM types exist (Postgres)
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_contact_requests_sender_role" AS ENUM ('hiring','investor','admin');
      `, { transaction: t }).catch(() => {});
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_contact_requests_status" AS ENUM ('pending','approved','rejected','closed');
      `, { transaction: t }).catch(() => {});

      // 2) Create table if missing (with full schema + FKs)
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS "contact_requests" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "sender_id" UUID NOT NULL,
          "sender_role" "enum_contact_requests_sender_role" NOT NULL,
          "recipient_id" UUID NOT NULL,
          "submission_id" UUID NULL,
          "subject" VARCHAR(200) NOT NULL,
          "message" TEXT NOT NULL,
          "sender_company_name" VARCHAR(255) NULL,
          "sender_firm_name" VARCHAR(255) NULL,
          "contact_email" VARCHAR(255) NULL,
          "contact_phone" VARCHAR(50) NULL,
          "status" "enum_contact_requests_status" NOT NULL DEFAULT 'pending',
          "seen_at" TIMESTAMPTZ NULL,
          "replied_at" TIMESTAMPTZ NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT "contact_requests_sender_fk" FOREIGN KEY ("sender_id")
            REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
          CONSTRAINT "contact_requests_recipient_fk" FOREIGN KEY ("recipient_id")
            REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE CASCADE,
          CONSTRAINT "contact_requests_submission_fk" FOREIGN KEY ("submission_id")
            REFERENCES "submissions"("id") ON UPDATE CASCADE ON DELETE SET NULL
        );
      `, { transaction: t });

      // 3) If table exists already, reconcile columns/constraints/defaults
      // (These are safe no-ops if already present.)
      await queryInterface.sequelize.query(`
        ALTER TABLE "contact_requests"
          ADD COLUMN IF NOT EXISTS "sender_id" UUID,
          ADD COLUMN IF NOT EXISTS "sender_role" "enum_contact_requests_sender_role",
          ADD COLUMN IF NOT EXISTS "recipient_id" UUID,
          ADD COLUMN IF NOT EXISTS "submission_id" UUID,
          ADD COLUMN IF NOT EXISTS "subject" VARCHAR(200),
          ADD COLUMN IF NOT EXISTS "message" TEXT,
          ADD COLUMN IF NOT EXISTS "sender_company_name" VARCHAR(255),
          ADD COLUMN IF NOT EXISTS "sender_firm_name" VARCHAR(255),
          ADD COLUMN IF NOT EXISTS "contact_email" VARCHAR(255),
          ADD COLUMN IF NOT EXISTS "contact_phone" VARCHAR(50),
          ADD COLUMN IF NOT EXISTS "status" "enum_contact_requests_status" DEFAULT 'pending',
          ADD COLUMN IF NOT EXISTS "seen_at" TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS "replied_at" TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW(),
          ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ DEFAULT NOW();
      `, { transaction: t });

      // Ensure NOT NULL where required
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='sender_id' AND is_nullable='YES') THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "sender_id" SET NOT NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='sender_role' AND is_nullable='YES') THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "sender_role" SET NOT NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='recipient_id' AND is_nullable='YES') THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "recipient_id" SET NOT NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='subject' AND is_nullable='YES') THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "subject" SET NOT NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='message' AND is_nullable='YES') THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "message" SET NOT NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='status' AND column_default IS NULL) THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "status" SET DEFAULT 'pending';
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='created_at' AND column_default IS NULL) THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "created_at" SET DEFAULT NOW();
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='contact_requests' AND column_name='updated_at' AND column_default IS NULL) THEN
            ALTER TABLE "contact_requests" ALTER COLUMN "updated_at" SET DEFAULT NOW();
          END IF;
        END$$;
      `, { transaction: t });

      // Ensure foreign keys (skip if they already exist)
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'contact_requests_sender_fk'
          ) THEN
            ALTER TABLE "contact_requests"
            ADD CONSTRAINT "contact_requests_sender_fk"
            FOREIGN KEY ("sender_id") REFERENCES "users"("id")
            ON UPDATE CASCADE ON DELETE CASCADE;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'contact_requests_recipient_fk'
          ) THEN
            ALTER TABLE "contact_requests"
            ADD CONSTRAINT "contact_requests_recipient_fk"
            FOREIGN KEY ("recipient_id") REFERENCES "users"("id")
            ON UPDATE CASCADE ON DELETE CASCADE;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'contact_requests_submission_fk'
          ) THEN
            ALTER TABLE "contact_requests"
            ADD CONSTRAINT "contact_requests_submission_fk"
            FOREIGN KEY ("submission_id") REFERENCES "submissions"("id")
            ON UPDATE CASCADE ON DELETE SET NULL;
          END IF;
        END$$;
      `, { transaction: t });

      // 4) Ensure indexes
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS contact_requests_recipient_status_idx
          ON "contact_requests" ("recipient_id","status");
        CREATE INDEX IF NOT EXISTS contact_requests_sender_idx
          ON "contact_requests" ("sender_id");
        CREATE INDEX IF NOT EXISTS contact_requests_submission_idx
          ON "contact_requests" ("submission_id");
      `, { transaction: t });
    });
  },

  async down(queryInterface) {
    // Optional: forward-only is usually safest in prod; keep down empty or only drop indexes.
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS contact_requests_recipient_status_idx;
        DROP INDEX IF EXISTS contact_requests_sender_idx;
        DROP INDEX IF EXISTS contact_requests_submission_idx;
      `, { transaction: t });
      // Intentionally not dropping table/types to avoid accidental data loss later.
    });
  },
};
