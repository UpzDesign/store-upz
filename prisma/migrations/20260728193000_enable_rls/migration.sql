-- Secure all application tables exposed through Supabase's public schema.
-- No anon/authenticated policies are created because the app reads and writes
-- through server-side Prisma using the privileged database connection.

ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ServiceField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CompanyService" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CatalogItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PackageItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BrandAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MarketingRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Engagement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EngagementAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;

-- Remove direct table access from Supabase client roles. The backend connection
-- remains unaffected because it uses the database owner / privileged role.
REVOKE ALL ON TABLE public."Company" FROM anon, authenticated;
REVOKE ALL ON TABLE public."TeamMember" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Service" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ServiceField" FROM anon, authenticated;
REVOKE ALL ON TABLE public."CompanyService" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Product" FROM anon, authenticated;
REVOKE ALL ON TABLE public."CatalogItem" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Collection" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Package" FROM anon, authenticated;
REVOKE ALL ON TABLE public."PackageItem" FROM anon, authenticated;
REVOKE ALL ON TABLE public."BrandAsset" FROM anon, authenticated;
REVOKE ALL ON TABLE public."MarketingRequest" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Engagement" FROM anon, authenticated;
REVOKE ALL ON TABLE public."EngagementAsset" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Project" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ProjectTask" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ProjectNote" FROM anon, authenticated;
REVOKE ALL ON TABLE public."ProjectActivity" FROM anon, authenticated;
REVOKE ALL ON TABLE public."Order" FROM anon, authenticated;
