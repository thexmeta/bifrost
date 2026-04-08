import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// Force enterprise mode - all enterprise features are enabled
const isEnterpriseBuild = true;

const nextConfig: NextConfig = {
	output: "export",
	trailingSlash: true,
	skipTrailingSlashRedirect: true,
	distDir: "out",
	images: {
		unoptimized: true,
	},
	basePath: "",
	generateBuildId: () => "build",
	typescript: {
		ignoreBuildErrors: false,
	},
	env: {
		NEXT_PUBLIC_IS_ENTERPRISE: isEnterpriseBuild ? "true" : "false",
	},
	// Proxy API requests to backend in development
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "http://localhost:8080/api/:path*",
			},
		];
	},
	webpack: (config) => {
		config.resolve = config.resolve || {};
		config.resolve.alias = config.resolve.alias || {};
		// In enterprise build, use the fallbacks directory which contains the actual components
		// (the _fallbacks naming is historical — these ARE the enterprise components)
		config.resolve.alias["@enterprise"] = path.join(__dirname, "app", "_fallbacks", "enterprise");
		config.resolve.alias["@schemas"] = path.join(__dirname, "app", "_fallbacks", "enterprise", "lib");
		// Ensure modules are resolved from the main project's node_modules
		config.resolve.modules = [
			path.join(__dirname, "node_modules"),
			"node_modules",
		];
		// Ensure symlinks are resolved correctly
		config.resolve.symlinks = true;
		return config;
	},
};

export default nextConfig;