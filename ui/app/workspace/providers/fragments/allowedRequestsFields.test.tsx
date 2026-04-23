import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { useForm, FormProvider, useController } from "react-hook-form";
import "@testing-library/jest-dom/vitest";

// Mock the validation utility
vi.mock("@/lib/utils/validation", () => ({
	isRequestTypeDisabled: (providerType: string | undefined, requestKey: string) => {
		const disabledMap: Record<string, string[]> = {
			openai: [],
			anthropic: ["text_completion", "text_completion_stream", "embedding"],
			bedrock: ["text_completion", "text_completion_stream"],
			gemini: ["text_completion", "text_completion_stream"],
			cohere: ["text_completion", "text_completion_stream", "image_generation"],
		};
		return (disabledMap[providerType ?? "openai"] ?? []).includes(requestKey);
	},
}));

// Mock UI components — FormField uses real useController hook so react-hook-form
// actually registers fields and tracks dirty/validation state
vi.mock("@/components/ui/form", () => ({
	FormField: ({ render, name, control }: any) => {
		const { field, fieldState } = useController({ name, control });
		return render({ field, fieldState });
	},
	FormControl: ({ children }: any) => <div>{children}</div>,
	FormItem: ({ children }: any) => <div>{children}</div>,
	FormLabel: ({ children }: any) => <label>{children}</label>,
	FormDescription: () => null,
	FormMessage: () => null,
}));

vi.mock("@/components/ui/switch", () => ({
	Switch: ({ checked, onCheckedChange, disabled, "data-testid": testId }: any) => (
		<button
			type="button"
			data-testid={testId || `switch-${name}`}
			aria-checked={checked ?? false}
			disabled={disabled}
			onClick={() => onCheckedChange?.(!(checked ?? false))}
		>
			{checked ? "on" : "off"}
		</button>
	),
}));

vi.mock("@/components/ui/popover", () => ({
	Popover: ({ children }: any) => <div>{children}</div>,
	PopoverTrigger: ({ children }: any) => <div>{children}</div>,
	PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/tooltip", () => ({
	TooltipProvider: ({ children }: any) => <div>{children}</div>,
	Tooltip: ({ children }: any) => <div>{children}</div>,
	TooltipTrigger: ({ children }: any) => <div>{children}</div>,
	TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
	Settings2: () => <span data-testid="settings-icon" />,
}));

// Import the component after mocks
import { AllowedRequestsFields } from "./allowedRequestsFields";

// Test wrapper with form context
function TestWrapper({ providerType }: { providerType: string }) {
	const methods = useForm({
		defaultValues: {
			allowed_requests: {
				list_models: true,
				text_completion: true,
				text_completion_stream: true,
				chat_completion: true,
				chat_completion_stream: true,
				responses: true,
				responses_stream: true,
				embedding: true,
				speech: true,
				speech_stream: true,
				transcription: true,
				transcription_stream: true,
				image_generation: true,
				image_generation_stream: true,
				image_edit: true,
				image_edit_stream: true,
				image_variation: true,
				count_tokens: true,
			},
			request_path_overrides: {},
		},
		mode: "onChange",
	});

	return (
		<FormProvider {...methods}>
			<AllowedRequestsFields
				control={methods.control}
				providerType={providerType as any}
				disabled={false}
			/>
			<div data-testid="is-dirty">{String(methods.formState.isDirty)}</div>
			<div data-testid="is-valid">{String(methods.formState.isValid)}</div>
		</FormProvider>
	);
}

describe("AllowedRequestsFields", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders all 18 request type switches", () => {
		render(<TestWrapper providerType="openai" />);

		const switches = screen.getAllByRole("button");
		expect(switches.length).toBeGreaterThanOrEqual(18);
	});

	it("disables unsupported request types for anthropic provider", () => {
		render(<TestWrapper providerType="anthropic" />);

		const switches = screen.getAllByRole("button");
		const disabledSwitches = switches.filter((s) => s.disabled);

		// Anthropic disables: text_completion, text_completion_stream, embedding
		expect(disabledSwitches).toHaveLength(3);
	});

	it("does not mark form as dirty on initial mount", () => {
		render(<TestWrapper providerType="openai" />);

		const isDirty = screen.getByTestId("is-dirty");
		expect(isDirty).toHaveTextContent("false");
	});

	it("does not mark form as dirty on re-render with same providerType", async () => {
		const { rerender } = render(<TestWrapper providerType="openai" />);

		expect(screen.getByTestId("is-dirty")).toHaveTextContent("false");

		await act(async () => {
			rerender(<TestWrapper providerType="openai" />);
		});

		expect(screen.getByTestId("is-dirty")).toHaveTextContent("false");
	});

	it("enables all switches for openai provider", () => {
		render(<TestWrapper providerType="openai" />);

		const switches = screen.getAllByRole("button");
		const enabledSwitches = switches.filter((s) => !s.disabled);
		expect(enabledSwitches.length).toBeGreaterThanOrEqual(18);
	});

	it("correctly disables specific request types for bedrock provider", () => {
		render(<TestWrapper providerType="bedrock" />);

		const switches = screen.getAllByRole("button");
		const disabledSwitches = switches.filter((s) => s.disabled);

		// Bedrock disables: text_completion, text_completion_stream
		expect(disabledSwitches).toHaveLength(2);
	});

	it("marks form as dirty when toggling a switch", async () => {
		render(<TestWrapper providerType="openai" />);

		// Initially not dirty
		expect(screen.getByTestId("is-dirty")).toHaveTextContent("false");

		// Find switches by aria-checked attribute (not disabled buttons)
		const allButtons = screen.getAllByRole("button");
		const switches = allButtons.filter((s) => s.hasAttribute("aria-checked"));
		expect(switches.length).toBeGreaterThanOrEqual(18);

		const enabledSwitch = switches.find((s) => s.getAttribute("aria-checked") === "true");
		expect(enabledSwitch).toBeDefined();

		// Toggle the switch off
		await act(async () => {
			fireEvent.click(enabledSwitch!);
		});

		// Wait for react-hook-form dirty tracking to flush
		await act(async () => {
			await new Promise((r) => setTimeout(r, 100));
		});

		// Form should now be dirty
		expect(screen.getByTestId("is-dirty")).toHaveTextContent("true");
	});

	it("marks form as valid when toggling a switch", async () => {
		render(<TestWrapper providerType="openai" />);

		const switches = screen.getAllByRole("button");
		const enabledSwitch = switches.find((s) => !s.disabled);
		expect(enabledSwitch).toBeDefined();

		await act(async () => {
			enabledSwitch!.click();
		});

		// Form should be valid (no validation errors for boolean toggle)
		expect(screen.getByTestId("is-valid")).toHaveTextContent("true");
	});
});
