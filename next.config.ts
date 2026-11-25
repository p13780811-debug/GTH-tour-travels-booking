import type { NextConfig } from "next";

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
    // PDF.js is used exclusively inside a browser file-input event in BulkListingUpload.
    // Preserve the real client parser and its worker; prevent unused SSR code from
    // pulling the PDF engine into the Node/Cloudflare server bundle.
    if (isServer && nextRuntime === "nodejs") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist$": `${process.cwd()}/src/lib/real-estate/pdf-browser-only.server.ts`,
        "read-excel-file/browser$": `${process.cwd()}/src/lib/real-estate/xlsx-browser-only.server.ts`,
      };
    }
    // Audit-only experiment: deduplicate source-confirmed repeated modules, keeping
    // RSC and SSR layers separate and preserving all Next.js cache groups.
    if (process.env.GTH_SHARED_CHUNK_PROBE === "1" && isServer && nextRuntime === "nodejs") {
      const split = config.optimization?.splitChunks;
      if (!split || typeof split !== "object") throw new Error("Expected Next server splitChunks config");
      split.cacheGroups = {
        ...split.cacheGroups,
        gthSharedServerModules: {
          test(module: {resource?: string; layer?: string}) {
            const resource = (module.resource || "").replaceAll("\\", "/");
            return (module.layer === "rsc" || module.layer === "ssr") &&
              (resource.includes("/node_modules/lucide-react/dist/esm/icons/") ||
               resource.endsWith("/src/components/travel/TravelSectionNav.tsx") ||
               resource.endsWith("/src/data/destinations.ts"));
          },
          name(module: {layer?: string}) { return "gth-shared-" + module.layer; },
          chunks: "all", minChunks: 2, minSize: 0,
          maxInitialRequests: Infinity, maxAsyncRequests: Infinity,
          priority: 50, reuseExistingChunk: true,
        },
      };
    }
    if (process.env.GTH_BUNDLE_AUDIT === "1" && (!isServer || nextRuntime === "nodejs")) {
      config.plugins.push({
        apply(compiler: {
          hooks: { done: { tapPromise(name: string, callback: (stats: { toJson(options: Record<string, unknown>): unknown }) => Promise<void>): void } };
          outputPath: string;
        }) {
          compiler.hooks.done.tapPromise("GthServerBundleAudit", async (stats) => {
            const { writeFileSync } = await import("node:fs");
            const { join } = await import("node:path");
            const report = stats.toJson({
              all: false, assets: true, chunks: true, chunkModules: true,
              modules: true, nestedModules: true, ids: true,
              dependentModules: true, orphanModules: true,
              groupModulesByAttributes: false, groupModulesByCacheStatus: false,
              groupModulesByExtension: false, groupModulesByLayer: false,
              groupModulesByPath: false, groupModulesByType: false,
              modulesSpace: Infinity, chunkModulesSpace: Infinity, nestedModulesSpace: Infinity,
            });
            writeFileSync(join(process.env.RUNNER_TEMP || compiler.outputPath, isServer ? "gth-server-audit.json" : "gth-client-audit.json"), JSON.stringify(report));
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
