-- Execute in Supabase SQL Editor after confirming the public API is server-only.
-- The Node backend uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Remove broad client-side access. Public access goes through the Express API.
DROP POLICY IF EXISTS "messages_read_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- No anon/authenticated policies are created for private/admin tables.
-- Contact messages are inserted by /api/contact through the backend service role.
-- Public GET routes are also served by the backend and expose only intended fields.

-- Remove any other anon/authenticated policies from the backend-owned tables.
DO $$
DECLARE
	policy_record RECORD;
BEGIN
	FOR policy_record IN
		SELECT schemaname, tablename, policyname
		FROM pg_policies
		WHERE schemaname = 'public'
			AND tablename IN (
				'admins', 'messages', 'projects', 'publications',
				'comments', 'skills', 'events', 'profile'
			)
			AND ('anon' = ANY(roles) OR 'authenticated' = ANY(roles))
	LOOP
		EXECUTE format(
			'DROP POLICY IF EXISTS %I ON %I.%I',
			policy_record.policyname,
			policy_record.schemaname,
			policy_record.tablename
		);
	END LOOP;
END $$;

-- Ensure admin passwords are stored as bcrypt hashes before enabling the new login.
-- The migration script backend/scripts/hash-admin-password.js performs the update.
