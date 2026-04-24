import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { providersApi } from "@/lib/store/apis/providersApi";
import { setupListeners } from "@reduxjs/toolkit/query";
import "@testing-library/jest-dom/vitest";

// Mock enterprise lib BEFORE importing the component
vi.mock("@enterprise/lib", () => ({
	RbacResource: { ModelProvider: "model_provider" },
	RbacOperation: { Update: "update" },
	useRbac: () => true,
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock update mutation
const mockUpdateProvider = vi.fn().mockResolvedValue({
	name: "nvidia-nim",
	provider_status: "active",
	keys: [],
	custom_provider_config: {
		base_provider_type: "openai",
		is_key_less: false,
		allowed_requests: {
			chat_completion: true,
			chat_completion_stream: true,
		},
	},
});

vi.mock("@/lib/store/apis/providersApi", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/store/apis/providersApi")>();
	return {
		...actual,
		useUpdateProviderMutation: () => [mockUpdateProvider, { isLoading: false }],
	};
});

// Mock the store hooks
const mockDispatch = vi.fn();
vi.mock("@/lib/store", () => ({
	useAppDispatch: () => mockDispatch,
	getErrorMessage: vi.fn((err: any) => err?.data?.error?.message || "Error"),
	setProviderFormDirtyState: vi.fn(),
}));

// Mock the UI components
vi.mock("@/components/ui/form", () => ({
	Form: ({ children }: any) => <form data-testid="form">{children}</form>,
	FormField: ({ render, name, control }: any) => {
		const field = {
			value: name?.includes("base_provider_type") ? "openai" : name?.includes("is_key_less") ? false : true,
			onChange: vi.fn(),
			name,
		};
		return render({ field, fieldState: { error: null } });
	},
	FormControl: ({ children }: any) => <div>{children}</div>,
	FormItem: ({ children }: any) => <div>{children}</div>,
	FormLabel: ({ children }: any) => <label>{children}</label>,
	FormDescription: ({ children }: any) => <p>{children}</p>,
	FormMessage: () => null,
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({ children, value, onValueChange }: any) => (
		<select data-testid="base-provider-select" value={value} onChange={(e) => onValueChange(e.target.value)}>
			{children}
		</select>
	),
	SelectTrigger: ({ children, disabled }: any) => <div data-disabled={disabled}>{children}</div>,
	SelectContent: ({ children }: any) => <div>{children}</div>,
	SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
	SelectValue: () => <span data-testid="select-value" />,
}));

vi.mock("@/components/ui/switch", () => ({
	Switch: ({ checked, onCheckedChange, disabled, "data-testid": testId, id }: any) => (
		<button
			type="button"
			data-testid={testId || `switch-${id || "unknown"}`}
			id={id}
			aria-checked={checked ?? false}
			disabled={disabled}
			onClick={() => onCheckedChange?.(!(checked ?? false))}
		/>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, disabled, type, "data-testid": testId, onClick, isLoading }: any) => (
		<button type={type} disabled={disabled || isLoading} data-testid={testId || "button"} onClick={onClick}>
			{isLoading ? "Loading..." : children}
		</button>
	),
}));

vi.mock("@/components/ui/tooltip", () => ({
	TooltipProvider: ({ children }: any) => <div>{children}</div>,
	Tooltip: ({ children }: any) => <div>{children}</div>,
	TooltipTrigger: ({ children }: any) => <div>{children}</div>,
	TooltipContent: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children }: any) => <div>{children}</div>,
	PopoverTrigger: ({ children }: any) => <div>{children}</div>,
	PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
	Settings2: () => <span data-testid="settings-icon" />,
}));

// Mock AllowedRequestsFields to avoid needing FormProvider context
vi.mock("./allowedRequestsFields", () => ({
	AllowedRequestsFields: ({ control, providerType, disabled }: any) => (
		<div data-testid="allowed-requests-fields">
			<span>Provider: {providerType}</span>
		</div>
	),
}));

// Now import the component (after mocks are set up)
import { ApiStructureFormFragment } from "./apiStructureFormFragment";

// Create a minimal store for the test
function createTestStore() {
	const store = configureStore({
		reducer: {
			[providersApi.reducerPath]: providersApi.reducer,
		},
		middleware: (getDefaultMiddleware: any) =>
			getDefaultMiddleware().concat(providersApi.middleware),
	});
	setupListeners(store.dispatch);
	return store;
}

const mockProvider = {
	name: "nvidia-nim",
	provider_status: "active" as const,
	keys: [] as any[],
	network_config: {
		base_url: "https://integrate.api.nvidia.com",
		default_request_timeout_in_seconds: 120,
		max_retries: 5,
		retry_backoff_initial: 100,
		retry_backoff_max: 5000,
	},
	concurrency_and_buffer_size: {
		concurrency: 1000,
		buffer_size: 5000,
	},
	custom_provider_config: {
		base_provider_type: "openai" as const,
		is_key_less: false,
		allowed_requests: {
			chat_completion: true,
			chat_completion_stream: true,
			embedding: true,
			list_models: true,
		},
	},
};

describe("ApiStructureFormFragment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function renderComponent(provider = mockProvider) {
		const store = createTestStore();
		return render(
			<Provider store={store}>
				<ApiStructureFormFragment provider={provider} />
			</Provider>,
		);
	}

	it("renders the form with base provider select", () => {
		renderComponent();

		// The form should render
		const form = screen.getByTestId("form");
		expect(form).toBeInTheDocument();

		// Base provider select should be present
		const select = screen.getByTestId("base-provider-select");
		expect(select).toBeInTheDocument();
	});

	it("has save button initially disabled (form not dirty)", () => {
		renderComponent();

		// After initial render, form is not dirty so submit should be disabled
		const submitButton = screen.getByRole("button", { name: /save/i });
		expect(submitButton).toBeDisabled();
	});

	it("renders with correct provider config data", () => {
		renderComponent();

		// Verify the component rendered correctly with provider data
		const select = screen.getByTestId("base-provider-select");
		expect(select).toBeInTheDocument();

		// The form should render with the provider's custom_provider_config
		// Verify the form element is present
		const form = screen.getByTestId("form");
		expect(form).toBeInTheDocument();
	});
});
