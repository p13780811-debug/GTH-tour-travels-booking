import type { NextConfig } from "next";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Exclude repository-only documentation and test files from runtime tracing.
  // Do not exclude any application datasets, native image dependencies or route code.
  outputFileTracingExcludes: {
    "/*": ["./docs/**/*", "./tests/**/*", "./.github/**/*"],
  },
  // Compile-only diagnostic: map anonymous server chunks to real module names.
  // No stats plugin is installed for normal development or production builds.
  webpack(config, { isServer, nextRuntime }) {
    if (process.env.GTH_BUNDLE_AUDIT === "1" && isServer && nextRuntime === "nodejs") {
      config.plugins.push({
        apply(compiler: {
          hooks: { done: { tap(name: string, callback: (stats: { toJson(options: Record<string, unknown>): unknown }) => void): void } };
          outputPath: string;
        }) {
          compiler.hooks.done.tap("GthServerBundleAudit", (stats) => {
            const report = stats.toJson({
              all: false, assets: true, chunks: true, chunkModules: true,
              modules: true, nestedModules: true, ids: true,
              modulesSpace: Infinity, chunkModulesSpace: Infinity, nestedModulesSpace: Infinity,
            });
            writeFileSync(join(compiler.outputPath, "gth-server-audit.json"), JSON.stringify(report));
          });
        },
      });
    }
    return config;
  },
  // Public editorial URL compatibility. A former /tender/guides link must not
  // fall through to the protected /tender/[id] UUID route.
  async redirects() {
    // Legacy hotel search links often carried ?city=Kolkata without a mode.
    // Do not treat a plain city/name as a request to open our non-bookable
    // public directory. Preserve the original query while selecting the
    // existing Nuitee supplier booking widget. Explicit view=directory stays.
    const bookingKeys=["city","destination","name","country"];
    const bookingRedirects=bookingKeys.map(key=>({
      source:"/hotels",
      has:[{type:"query" as const,key}],
      missing:[{type:"query" as const,key:"view"}],
      destination:"/hotels?view=booking",
      permanent:false,
    }));
    return [
      // Legacy public policy links are not canonical pages. Redirect rather than
      // serving duplicate legal content or letting old crawlers hit a 404.
      {source:"/privacy",destination:"/privacy-policy",permanent:true},
      {source:"/terms",destination:"/terms-and-conditions",permanent:true},
      {source:"/tender/guides",destination:"/knowledge/tenders",permanent:true},
      ...bookingRedirects,
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/commons/**",
      },
    ],
  },
};

export default nextConfig;
