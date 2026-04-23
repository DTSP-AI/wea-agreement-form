import type { NextConfig } from "next";

// ============================================================================
// Route lockout (2026-04-23)
// ----------------------------------------------------------------------------
// Only /plan_c_addendum is exposed right now. All other plan routes + the
// homepage 307-redirect to it. Page files are intentionally preserved so we
// can unlock later by deleting the `redirects()` array.
//
// Rollback: delete the redirects() function below → all plan routes are
// reachable again. No other changes required.
// ============================================================================
const nextConfig: NextConfig = {
  async redirects() {
    const target = "/plan_c_addendum";
    return [
      { source: "/", destination: target, permanent: false },
      { source: "/plan_a", destination: target, permanent: false },
      { source: "/plan_b", destination: target, permanent: false },
      { source: "/plan_c", destination: target, permanent: false },
    ];
  },
};

export default nextConfig;
