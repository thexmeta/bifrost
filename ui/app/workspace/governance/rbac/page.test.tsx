import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RBACPage from "@/app/workspace/governance/rbac/page";

// Mock the RTK Query hooks
vi.mock("@/lib/store", () => ({
	useGetCoreConfigQuery: vi.fn(() => ({
		data: {
			enterprise: {
				rbac: { enabled: false, default_role: "viewer" },
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

describe("RBACPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page title and description", () => {
		render(<RBACPage />);

		expect(screen.getByText("Roles & Permissions")).toBeInTheDocument();
		expect(
			screen.getByText("Manage user roles and permissions for fine-grained access control")
		).toBeInTheDocument();
	});

	it("renders the RBAC toggle", () => {
		render(<RBACPage />);

		const toggle = screen.getByTestId("rbac-toggle");
		expect(toggle).toBeInTheDocument();
	});

	it("renders the save button", () => {
		render(<RBACPage />);

		expect(screen.getByTestId("save-rbac")).toBeInTheDocument();
	});

	it("renders default roles list", () => {
		render(<RBACPage />);

		expect(screen.getByTestId("role-admin")).toBeInTheDocument();
		expect(screen.getByTestId("role-editor")).toBeInTheDocument();
		expect(screen.getByTestId("role-viewer")).toBeInTheDocument();
	});

	it("shows Admin role with correct details", () => {
		render(<RBACPage />);

		const adminRole = screen.getByTestId("role-admin");
		expect(adminRole).toHaveTextContent("Admin");
		expect(adminRole).toHaveTextContent("Full access to all resources");
	});

	it("shows Viewer role with correct details", () => {
		render(<RBACPage />);

		const viewerRole = screen.getByTestId("role-viewer");
		expect(viewerRole).toHaveTextContent("Viewer");
		expect(viewerRole).toHaveTextContent("Read-only access to resources");
	});

	it("shows loading state when config is loading", async () => {
		const { useGetCoreConfigQuery } = await import("@/lib/store");
		vi.mocked(useGetCoreConfigQuery).mockReturnValue({
			data: undefined,
			isLoading: true,
		} as any);

		render(<RBACPage />);

		expect(screen.getByText("Loading RBAC settings...")).toBeInTheDocument();
	});
});
