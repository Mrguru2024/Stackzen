-- Phase 9: Admins must enroll MFA (enforced in app; flag documents intent in DB).
UPDATE "User"
SET "mfaRequired" = true
WHERE "role" IN ('ADMIN', 'SUPER_ADMIN')
  AND "mfaRequired" = false;
