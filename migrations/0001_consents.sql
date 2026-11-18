-- Proof of consent for newsletter subscribers (GDPR Art. 7(1)).
-- One row per confirmed signup. Run once in the D1 console (database: gtc-consent).
CREATE TABLE IF NOT EXISTS consents (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  email                 TEXT NOT NULL,
  signed_up_at          TEXT NOT NULL,  -- when the form was submitted (ISO 8601, UTC)
  confirmed_at          TEXT NOT NULL,  -- when the Confirm button was pressed (ISO 8601, UTC)
  form_text_version     TEXT NOT NULL,  -- which signup-form wording the person saw
  confirm_email_version TEXT NOT NULL,  -- which confirm-email wording the person received
  unsubscribed_at       TEXT            -- filled in later, when we sync unsubscribes
);

CREATE INDEX IF NOT EXISTS idx_consents_email ON consents (email);
