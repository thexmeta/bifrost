import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import VaultConfigurationPage from "@/app/workspace/vault/page";

vi.mock("@/lib/store", () => ({
	useGetCoreConfigQuery: vi.fn(() => ({
		data: {
			enterprise: {
				vault: {
					enabled: false,
					type: "hashicorp",
					address: "",
					token: "",
					sync_paths: ["bifrost/*"],
					sync_interval_seconds: 300,
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

describe("VaultConfigurationPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByText("Vault Integration")).toBeInTheDocument();
	});

	it("renders the enabled toggle", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByTestId("vault-enabled-toggle")).toBeInTheDocument();
	});

	it("renders the vault address input", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByTestId("vault-address-input")).toBeInTheDocument();
	});

	it("renders the vault token input", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByTestId("vault-token-input")).toBeInTheDocument();
	});

	it("renders the save button", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByTestId("vault-save-button")).toBeInTheDocument();
	});

	it("renders the reset button", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByTestId("vault-reset-button")).toBeInTheDocument();
	});

	it("shows loading state when config is loading", async () => {
		const { useGetCoreConfigQuery } = await import("@/lib/store");
		vi.mocked(useGetCoreConfigQuery).mockReturnValue({
			data: undefined,
			isLoading: true,
		} as any);

		render(<VaultConfigurationPage />);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("displays supported vault providers", () => {
		render(<VaultConfigurationPage />);

		expect(screen.getByText("HashiCorp Vault")).toBeInTheDocument();
		expect(screen.getByText("AWS Secrets Manager")).toBeInTheDocument();
		expect(screen.getByText("Google Secret Manager")).toBeInTheDocument();
		expect(screen.getByText("Azure Key Vault")).toBeInTheDocument();
	});
});
