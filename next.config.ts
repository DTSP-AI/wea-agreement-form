import type { NextConfig } from "next";

// ============================================================================
// Route lockout (updated 2026-05-16)
// ----------------------------------------------------------------------------
// Plan A · Addendum 3 (/plan_a_addendum_3) is the ONLY live proposal. The
// homepage and every superseded plan route 307-redirect to it, so no stale
// bookmark — /plan_c_addendum especially — can surface dead pricing
// ($1,800 / $900 weeklies). Page files are preserved; trim this array to
// unlock a route again.
//
// Rollback: delete the redirects() function below → all plan routes are
// reachable again. No other changes required.
// ============================================================================
const nextConfig: NextConfig = {
  async redirects() {
    const target = "/plan_a_addendum_3";
    return [
      { source: "/", destination: target, permanent: false },
      { source: "/plan_a", destination: target, permanent: false },
      { source: "/plan_b", destination: target, permanent: false },
      { source: "/plan_c", destination: target, permanent: false },
      { source: "/plan_a_addendum", destination: target, permanent: false },
      { source: "/plan_c_addendum", destination: target, permanent: false },
      { source: "/plan_c_addendum_2", destination: target, permanent: false },
    ];
  },
};

export default nextConfig;
