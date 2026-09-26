CREATE TABLE public.video_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  videos_used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start)
);
GRANT SELECT ON public.video_usage TO authenticated;
GRANT ALL ON public.video_usage TO service_role;
ALTER TABLE public.video_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own video usage" ON public.video_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id text,
  status text NOT NULL DEFAULT 'pending',
  prompt text NOT NULL,
  path text,
  demo boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_jobs TO authenticated;
GRANT ALL ON public.video_jobs TO service_role;
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own video jobs" ON public.video_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Own videos read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);