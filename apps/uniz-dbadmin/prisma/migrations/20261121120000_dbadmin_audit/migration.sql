-- Append-only history for the webmaster database editor.
-- The uniz_dbadmin login is granted INSERT and SELECT only. Triggers reject updates and deletes.

CREATE SCHEMA IF NOT EXISTS uniz_dbadmin;

CREATE TABLE IF NOT EXISTS uniz_dbadmin.changes (
    id TEXT NOT NULL,
    at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id TEXT NOT NULL,
    actor_username TEXT NOT NULL,
    database_name TEXT NOT NULL,
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    primary_key JSONB,
    action TEXT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    sql_text TEXT NOT NULL,
    reverses_id TEXT,
    undoable BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT changes_pkey PRIMARY KEY (id),
    CONSTRAINT changes_action_check CHECK (action IN ('insert', 'update', 'delete', 'undo', 'sql'))
);

CREATE INDEX IF NOT EXISTS changes_at_idx ON uniz_dbadmin.changes (at DESC);
CREATE INDEX IF NOT EXISTS changes_reverses_id_idx ON uniz_dbadmin.changes (reverses_id);

CREATE TABLE IF NOT EXISTS uniz_dbadmin.requests (
    id TEXT NOT NULL,
    at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id TEXT,
    actor_username TEXT,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER,
    ip TEXT,
    kind TEXT NOT NULL,
    CONSTRAINT requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS requests_at_idx ON uniz_dbadmin.requests (at DESC);

CREATE OR REPLACE FUNCTION uniz_dbadmin.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'history is append-only';
END;
$$;

DROP TRIGGER IF EXISTS changes_no_update ON uniz_dbadmin.changes;
CREATE TRIGGER changes_no_update
  BEFORE UPDATE OR DELETE ON uniz_dbadmin.changes
  FOR EACH ROW EXECUTE FUNCTION uniz_dbadmin.prevent_audit_mutation();

DROP TRIGGER IF EXISTS changes_no_truncate ON uniz_dbadmin.changes;
CREATE TRIGGER changes_no_truncate
  BEFORE TRUNCATE ON uniz_dbadmin.changes
  FOR EACH STATEMENT EXECUTE FUNCTION uniz_dbadmin.prevent_audit_mutation();

DROP TRIGGER IF EXISTS requests_no_update ON uniz_dbadmin.requests;
CREATE TRIGGER requests_no_update
  BEFORE UPDATE OR DELETE ON uniz_dbadmin.requests
  FOR EACH ROW EXECUTE FUNCTION uniz_dbadmin.prevent_audit_mutation();

DROP TRIGGER IF EXISTS requests_no_truncate ON uniz_dbadmin.requests;
CREATE TRIGGER requests_no_truncate
  BEFORE TRUNCATE ON uniz_dbadmin.requests
  FOR EACH STATEMENT EXECUTE FUNCTION uniz_dbadmin.prevent_audit_mutation();
