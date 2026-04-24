import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DatadogConfigurationPage from "@/app/workspace/datadog/page";

vi.mock("@/lib/store", () => ({
	useGetCoreConfigQuery: vi.fn(() => ({
		data: {
			enterprise: {
				datadog: {
					enabled: false,
					api_key: "",
					app_key: "",
					site: "datadoghq.com",
					send_traces: true,
					send_metrics: true,
					send_logs: false,
				},
			},
		},
		isLoading: false,
	})),
	useUpdateCoreConfigMutation: vi.fn(() => [
		vi.fn().mockResolvedValue({}),
		{ isLoading: false },
	]),
	getErrorMessage: vi.fn(() => "Error message"),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/components/ui/switch", () => ({
	Switch: ({ checked, onCheckedChange, "data-testid": testId }: any) => (
		<button data-testid={testId} onClick={() => onCheckedChange(!checked)}>
			{checked ? "on" : "off"}
		</button>
	),
}));

describe("DatadogConfigurationPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByText("Datadog Integration")).toBeInTheDocument();
	});

	it("renders the enabled toggle", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-enabled-toggle")).toBeInTheDocument();
	});

	it("renders the API key input", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-api-key-input")).toBeInTheDocument();
	});

	it("renders the app key input", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-app-key-input")).toBeInTheDocument();
	});

	it("renders the save button", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-save-button")).toBeInTheDocument();
	});

	it("renders the reset button", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-reset-button")).toBeInTheDocument();
	});

	it("renders the traces toggle", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-traces-toggle")).toBeInTheDocument();
	});

	it("renders the metrics toggle", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-metrics-toggle")).toBeInTheDocument();
	});

	it("renders the logs toggle", () => {
		render(<DatadogConfigurationPage />);

		expect(screen.getByTestId("datadog-logs-toggle")).toBeInTheDocument();
	});

	it("shows loading state when config is loading", async () => {
		const { useGetCoreConfigQuery } = await import("@/lib/store");
		vi.mocked(useGetCoreConfigQuery).mockReturnValue({
			data: undefined,
			isLoading: true,
		} as any);

		render(<DatadogConfigurationPage />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});
});
