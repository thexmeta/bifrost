import { IS_ENTERPRISE } from "@/lib/constants/config";
import { BifrostConfig, GlobalProxyConfig, LatestReleaseResponse } from "@/lib/types/config";
import axios from "axios";
import { baseApi } from "./baseApi";

export const configApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		// Get core configuration
		getCoreConfig: builder.query<BifrostConfig, { fromDB?: boolean }>({
			query: ({ fromDB = false } = {}) => ({
				url: "/config",
				params: { from_db: fromDB },
			}),
			providesTags: ["Config"],
		}),

		// Get version information
		getVersion: builder.query<string, void>({
			query: () => ({
				url: "/version",
			}),
		}),

		// Get latest release from public site - DISABLED: No external telemetry
		getLatestRelease: builder.query<LatestReleaseResponse, void>({
			queryFn: async (_arg, { signal }) => {
				// Disabled: No external release check - no telemetry outside machine
				return { data: { name: "", changelogUrl: "" } };
			},
			keepUnusedDataFor: 300, // Cache for 5 minutes (seconds)
		}),
		// Update core configuration
		updateCoreConfig: builder.mutation<null, BifrostConfig>({
			query: (data) => ({
				url: "/config",
				method: "PUT",
				body: IS_ENTERPRISE ? { ...data, auth_config: undefined } : data,
			}),
			invalidatesTags: ["Config"],
		}),

		// Update proxy configuration
		updateProxyConfig: builder.mutation<null, GlobalProxyConfig>({
			query: (data) => ({
				url: "/proxy-config",
				method: "PUT",
				body: data,
			}),
			invalidatesTags: ["Config"],
		}),

		// Force a pricing sync immediately
		forcePricingSync: builder.mutation<null, void>({
			query: () => ({
				url: "/pricing/force-sync",
				method: "POST",
			}),
			invalidatesTags: ["Config"],
		}),
	}),
});

export const {
	useGetVersionQuery,
	useGetCoreConfigQuery,
	useUpdateCoreConfigMutation,
	useUpdateProxyConfigMutation,
	useForcePricingSyncMutation,
	useLazyGetCoreConfigQuery,
	useGetLatestReleaseQuery,
	useLazyGetLatestReleaseQuery,
} = configApi;