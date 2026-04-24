import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LogExportsPage from "@/app/workspace/log-exports/page";

vi.mock("@/lib/store", () => ({
	useGetCoreConfigQuery: vi.fn(() => ({
		data: {
			enterprise: {
				log_exports: {
					enabled: false,
					destination: {
						type: "s3",
						config: {
							bucket: "",
							region: "us-east-1",
							prefix: "bifrost-logs/",
							format: "json",
							compression: "gzip",
						},
					},
					schedule: { interval_hours: 1 },
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

vi.mock("@/components/ui/select", () => ({
	Select: ({ children, onValueChange, defaultValue }: any) => (
		<select data-testid="select" defaultValue={defaultValue}>
			{children}
		</select>
	),
	SelectTrigger: ({ children, "data-testid": testId }: any) => (
		<div data-testid={testId}>{children}</div>
	),
	SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
	SelectContent: ({ children }: any) => <>{children}</>,
	SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

describe("LogExportsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title", () => {
		render(<LogExportsPage />);

		expect(screen.getByText("Log Exports")).toBeInTheDocument();
	});

	it("renders the storage type selector", () => {
		render(<LogExportsPage />);

		expect(screen.getByTestId("storage-type-select")).toBeInTheDocument();
	});

	it("renders the bucket input", () => {
		render(<LogExportsPage />);

		expect(screen.getByTestId("bucket-input")).toBeInTheDocument();
	});

	it("renders the region selector", () => {
		render(<LogExportsPage />);

		expect(screen.getByTestId("region-select")).toBeInTheDocument();
	});

	it("renders the prefix input", () => {
		render(<LogExportsPage />);

		expect(screen.getByTestId("prefix-input")).toBeInTheDocument();
	});

	it("shows loading state when config is loading", async () => {
		const { useGetCoreConfigQuery } = await import("@/lib/store");
		vi.mocked(useGetCoreConfigQuery).mockReturnValue({
			data: undefined,
			isLoading: true,
		} as any);

		render(<LogExportsPage />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("displays alert with description", () => {
		render(<LogExportsPage />);

		expect(
			screen.getByText(/Automatically export Bifrost request logs to your cloud storage bucket/)
		).toBeInTheDocument();
	});
});
