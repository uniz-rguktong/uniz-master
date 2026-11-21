\getenv dbadmin_password DBADMIN_DB_PASSWORD

-- set_config returns the value. Hide that row so psql -f does not print it.
\o /dev/null
SELECT set_config('uniz.dbadmin_password', :'dbadmin_password', false);
\o

DO $$
BEGIN
  IF coalesce(current_setting('uniz.dbadmin_password', true), '') = '' THEN
    RAISE EXCEPTION 'DBADMIN_DB_PASSWORD is empty';
  END IF;
END
$$;

-- The format() row is the ALTER/CREATE text, which contains the password.
\o /dev/null
SELECT format(
  'CREATE ROLE uniz_dbadmin LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
  current_setting('uniz.dbadmin_password')
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'uniz_dbadmin')
\gexec

SELECT format(
  'ALTER ROLE uniz_dbadmin WITH LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
  current_setting('uniz.dbadmin_password')
)
\gexec
\o

ALTER ROLE uniz_dbadmin SET statement_timeout = '60s';

\o /dev/null
SELECT set_config('uniz.dbadmin_password', '', false);
\o

DO $$
DECLARE
  sch text;
  owner name;
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO uniz_dbadmin', current_database());

  FOR sch IN
    SELECT nspname
    FROM pg_namespace
    WHERE nspname <> 'information_schema'
      AND nspname NOT LIKE 'pg_%'
  LOOP
    BEGIN
    EXECUTE format('REVOKE CREATE ON SCHEMA %I FROM uniz_dbadmin', sch);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO uniz_dbadmin', sch);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO uniz_dbadmin', sch);

    IF sch = 'uniz_dbadmin' THEN
      EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA uniz_dbadmin FROM uniz_dbadmin';
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'uniz_dbadmin' AND table_name = 'changes') THEN
        EXECUTE 'GRANT SELECT, INSERT ON uniz_dbadmin.changes TO uniz_dbadmin';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'uniz_dbadmin' AND table_name = 'requests') THEN
        EXECUTE 'GRANT SELECT, INSERT ON uniz_dbadmin.requests TO uniz_dbadmin';
      END IF;
      EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA uniz_dbadmin GRANT SELECT, INSERT ON TABLES TO uniz_dbadmin';
    ELSE
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO uniz_dbadmin',
        sch
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO uniz_dbadmin',
        sch
      );
    END IF;

    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO uniz_dbadmin',
      sch
    );

    FOR owner IN
      SELECT DISTINCT r.rolname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_roles r ON r.oid = c.relowner
      WHERE n.nspname = sch
        AND c.relkind IN ('r', 'p')
        AND r.rolname <> 'uniz_dbadmin'
    LOOP
      BEGIN
        IF sch = 'uniz_dbadmin' THEN
          EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT SELECT, INSERT ON TABLES TO uniz_dbadmin',
            owner, sch
          );
        ELSE
          EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO uniz_dbadmin',
            owner, sch
          );
        END IF;
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO uniz_dbadmin',
          owner, sch
        );
      EXCEPTION
        WHEN insufficient_privilege THEN
          NULL;
      END;
    END LOOP;
    EXCEPTION
      WHEN insufficient_privilege THEN
        NULL;
    END;
  END LOOP;
END
$$;
