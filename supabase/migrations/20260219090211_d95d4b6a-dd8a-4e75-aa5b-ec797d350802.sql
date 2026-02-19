-- Allow public (anonymous) users to read active clinic-doctor affiliations
-- This is safe: clinic_doctors only contains UUIDs and status strings (no PII)
CREATE POLICY "Public can view active clinic doctor affiliations"
ON public.clinic_doctors
FOR SELECT
TO public
USING (status = 'active');