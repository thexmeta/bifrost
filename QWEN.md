# Bifrost AI Gateway — Project Context

## Project Overview

**Bifrost** is a high-performance AI gateway that unifies 20+ LLM providers (OpenAI, Anthropic, AWS Bedrock, Google Vertex, Azure, and more) through a single OpenAI-compatible API. It delivers ~11µs overhead at 5,000 RPS and serves as an MCP (Model Context Protocol) gateway for tool-calling AI agents.

**GitHub:** `maximhq/bifrost`  
**Documentation:** https://docs.getbifrost.ai

### Core Capabilities

- **Unified Interface:** Single API for 20+ providers with automatic failover and load balancing
- **Model Context Protocol (MCP):** Enable AI models to use external tools (filesystem, web search, databases)
- **Semantic Caching:** Intelligent response caching based on semantic similarity
- **Governance:** Budget management, rate limiting, virtual keys, teams, and customer budgets
- **Multimodal Support:** Text, images, audio, video, and streaming behind a common interface
- **Custom Plugins:** Extensible middleware architecture for analytics, monitoring, and custom logic
- **Enterprise Features:** SSO (Google/GitHub), Vault integration, clustering, observability

---

## Repository Structure

```
bifrost/
├── npx/                     # NPX script for easy installation
├── core/                    # Go core library — the engine (~35K lines)
│   ├── bifrost.go           # Main struct, request queuing, provider lifecycle
│   ├── inference.go         # Inference routing, fallbacks, streaming dispatch
│   ├── mcp.go               # MCP integration entry point
│   ├── schemas/             # ALL shared Go types — 41 files
│   │   ├── provider.go      # Provider interface (30+ methods)
│   │   ├── plugin.go        # LLMPlugin, MCPPlugin, HTTPTransportPlugin
│   │   ├── context.go       # BifrostContext (custom mutable context.Context)
│   │   ├── chatcompletions.go, responses.go, embedding.go, etc.
│   ├── providers/           # 20+ provider implementations
│   │   ├── openai/          # Reference implementation (largest)
│   │   ├── anthropic/       # Non-OpenAI-compatible example
│   │   ├── bedrock/         # AWS event-stream protocol
│   │   └── groq/, cerebras/, ollama/  # OpenAI-compatible (delegate to openai/)
│   ├── pool/                # Generic Pool[T] — dual-mode (prod/debug)
│   │   ├── pool_prod.go     # Zero-overhead sync.Pool wrapper (default)
│   │   └── pool_debug.go    # Double-release/leak detection (-tags pooldebug)
│   ├── mcp/                 # MCP protocol implementation
│   │   ├── agent.go         # Agent orchestration loop (multi-turn tool calling)
│   │   ├── toolmanager.go   # Tool registration, discovery, filtering
│   │   └── codemode/starlark/  # Starlark sandbox for code-mode execution
│   └── internal/
│       ├── llmtests/        # LLM integration tests (live API, scenario-based)
│       └── mcptests/        # MCP/Agent tests (mock-based)
│
├── framework/               # Data persistence, streaming, utilities
│   ├── configstore/         # Config storage (file, postgres)
│   ├── logstore/            # Log storage (file, postgres)
│   ├── vectorstore/         # Vector storage (Weaviate, Qdrant, Redis, Pinecone)
│   ├── streaming/           # Streaming accumulator, delta copying
│   ├── modelcatalog/        # Model metadata registry
│   ├── tracing/             # Distributed tracing helpers
│   └── encrypt/             # Encryption utilities
│
├── transports/
│   ├── config.schema.json   # JSON Schema — THE source of truth for config.json (~2700 lines)
│   └── bifrost-http/        # HTTP gateway transport
│       ├── server/          # Server lifecycle, route registration
│       ├── handlers/        # 27 HTTP endpoint handlers
│       │   ├── inference.go # Chat completions, responses API (~109KB)
│       │   ├── governance.go# Virtual keys, teams, budgets (~100KB)
│       │   ├── mcp.go       # MCP client registry
│       │   └── ...          # providers, logging, config, plugins, cache, health, etc.
│       ├── lib/             # Middleware chaining, config, context conversion
│       └── integrations/    # SDK compatibility layers (OpenAI, Anthropic, Bedrock, GenAI, LangChain, LiteLLM)
│
├── plugins/                 # Go plugins — each has own go.mod
│   ├── governance/          # Budget, rate limiting, virtual keys, routing, RBAC
│   ├── telemetry/           # Prometheus metrics, push gateway
│   ├── logging/             # Request/response audit logging
│   ├── semanticcache/       # Semantic response caching via vector store
│   ├── otel/                # OpenTelemetry tracing
│   ├── mocker/              # Mock responses for testing
│   ├── jsonparser/          # JSON extraction utilities
│   ├── maxim/               # Maxim observability integration
│   └── litellmcompat/       # LiteLLM SDK compatibility (HTTP transport)
│
├── ui/                      # Next.js web interface
│   ├── app/workspace/       # Feature pages (20+ workspace sections)
│   ├── components/          # Shared React components
│   └── lib/                 # Constants, utilities, types
│
├── tests/e2e/               # Playwright E2E tests
│   ├── core/                # Fixtures, page objects, helpers, API actions
│   └── features/            # Per-feature test suites (providers, virtual-keys, mcp, etc.)
│
├── docs/                    # Mintlify MDX documentation
│   ├── docs.json            # Navigation config
│   └── (architecture|features|providers|mcp|plugins|enterprise|...)
│
├── terraform/               # Infrastructure as Code
├── helm-charts/             # Kubernetes Helm charts
├── recipes/                 # Makefile includes (fly.mk, ecs.mk, local-k8s.mk)
├── scripts/                 # Utility scripts
└── examples/                # Example configurations and MCP servers
```

---

## Go Workspace Architecture

Bifrost is a **multi-module Go workspace** using `go.work` (requires **Go 1.26.1**):

```
go.work
├── core/go.mod              # github.com/maximhq/bifrost/core
├── framework/go.mod         # github.com/maximhq/bifrost/framework
├── transports/go.mod        # github.com/maximhq/bifrost/transports
└── plugins/*/go.mod         # 9 plugin modules
```

**Key Rules:**
- Run `go mod tidy` in the **specific module directory**, not root
- Cross-module imports resolve via workspace locally but need explicit `require` in `go.mod` for releases
- The `transports/go.mod` contains `replace` directives pointing to local modules

---

## Building and Running

### Quick Start

```bash
# Install and run locally (NPX)
npx -y @maximhq/bifrost

# Or use Docker
docker run -p 8080:8080 maximhq/bifrost
```

### Development Commands (Makefile)

```bash
# Full local dev (UI + API with hot reload via air)
make dev

# Build bifrost-http binary (requires UI build first)
make build

# Build UI only
make build-ui

# Run tests
make test-core                    # All provider integration tests
make test-core PROVIDER=openai    # Specific provider
make test-core PROVIDER=openai TESTCASE=TestSimpleChat  # Specific test
make test-mcp                     # All MCP/Agent tests
make test-mcp TESTCASE=TestAgentLoop  # Specific test
make test-plugins                 # All plugin tests
make test-governance              # Governance plugin specifically

# E2E tests (requires running dev server)
make run-e2e                      # All E2E tests
make run-e2e FLOW=providers       # Specific feature flow
make run-e2e-ui                   # With Playwright UI

# Code quality
make lint                         # Linting
make fmt                          # Format code
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | localhost | Server host |
| `PORT` | 8080 | Server port |
| `PROMETHEUS_LABELS` | — | Labels for Prometheus metrics |
| `LOG_STYLE` | json | Logger format: `json` or `pretty` |
| `LOG_LEVEL` | info | Logger level: `debug`, `info`, `warn`, `error` |
| `DEBUG` | — | Enable Delve debugger on port 2345 |
| `LOCAL` | — | Use local go.work for builds |

---

## Architecture Overview

### Request Flow

```
Client HTTP Request
  → FastHTTP Transport (parsing, validation ~2µs)
    → SDK Integration Layer (OpenAI/Anthropic/Bedrock format → Bifrost format)
      → Middleware Chain (lib.ChainMiddlewares, applied per-route)
        → HTTPTransportPreHook (HTTP-level plugins, can short-circuit)
          → PreLLMHook Pipeline (auth, rate-limit, cache check — registration order)
            → MCP Tool Discovery & Injection (if tool_choice present)
              → Provider Queue (channel-based, per-provider isolation)
                → Worker picks up request
                  → Key Selection (~10ns weighted random)
                    → Provider API Call (fasthttp client, connection pooling)
                      → Response / SSE Stream
                → PostLLMHook Pipeline (reverse order of PreLLMHooks)
              → Tool Execution Loop (if tool_calls in response, MCP agent loop)
            → HTTPTransportPostHook (reverse order)
          → Response Serialization
        → HTTP Response to Client
```

### Design Principles

1. **Provider Isolation:** Each provider has its own worker pool and queue. One provider failing doesn't cascade to others.

2. **Channel-Based Async:** Request routing uses Go channels (`chan *ChannelMessage`), not mutexes. The `ProviderQueue` struct manages channel lifecycle with atomic flags.

3. **Object Pooling Everywhere:** `sync.Pool` wrappers reduce GC pressure. Pools exist for: channel messages, response channels, error channels, stream channels, plugin pipelines, MCP requests, HTTP request/response objects, scanner buffers.

4. **Plugin Pipeline Symmetry:** Pre-hooks execute in registration order, post-hooks in **reverse** order (LIFO). For every pre-hook executed, the corresponding post-hook is guaranteed to run.

5. **Streaming:** SSE chunks flow through `chan chan *BifrostStreamChunk`. Accumulated into full response for post-hooks via `framework/streaming/accumulator.go`.

---

## Core Patterns

### BifrostContext — Custom Mutable Context

`BifrostContext` (`core/schemas/context.go`) is a custom `context.Context` with **thread-safe mutable values**:

```go
ctx := schemas.NewBifrostContext(parent, deadline)
ctx.SetValue(key, value)     // Thread-safe, uses RWMutex
ctx.WithValue(key, value)    // Chainable variant
```

**Reserved Context Keys** (set by Bifrost internals — DO NOT set manually):
- `BifrostContextKeySelectedKeyID/Name` — Set by governance plugin
- `BifrostContextKeyGovernance*` — Set by governance plugin
- `BifrostContextKeyNumberOfRetries`, `BifrostContextKeyFallbackIndex` — Set by retry/fallback logic
- `BifrostContextKeyStreamEndIndicator` — Set by streaming infrastructure
- `BifrostContextKeyTrace*`, `BifrostContextKeySpan*` — Set by tracing middleware

**User-Settable Keys** (plugins and handlers can set these):
- `BifrostContextKeyVirtualKey` (`x-bf-vk`) — Virtual key for governance
- `BifrostContextKeyAPIKeyName` (`x-bf-api-key`) — Explicit key selection by name
- `BifrostContextKeyAPIKeyID` (`x-bf-api-key-id`) — Explicit key selection by ID (takes priority)
- `BifrostContextKeyRequestID` — Request ID
- `BifrostContextKeyExtraHeaders` — Extra headers to forward to provider
- `BifrostContextKeySkipKeySelection` — Skip key selection (pass empty key)
- `BifrostContextKeyUseRawRequestBody` — Send raw body directly to provider

**Gotcha:** `BlockRestrictedWrites()` silently drops writes to reserved keys. This prevents plugins from accidentally overwriting internal state.

### Provider Implementation Pattern

**Category 1: Non-OpenAI-compatible** (Anthropic, Bedrock, Gemini, Cohere, HuggingFace, Replicate, ElevenLabs):
```
core/providers/<name>/
├── <name>.go              # Controller: constructor, interface methods, HTTP orchestration
├── <name>_test.go         # Tests
├── types.go               # ALL provider-specific structs (PascalCase prefixed with provider name)
├── utils.go               # Constants, base URLs, helpers
├── errors.go              # Error parsing: provider HTTP error → *schemas.BifrostError
├── chat.go                # Chat request/response converters
├── embedding.go           # Embedding converters (if supported)
└── responses.go           # Responses API + streaming converters
```

**Category 2: OpenAI-compatible** (Groq, Cerebras, Ollama, Perplexity, OpenRouter, Parasail, Nebius, xAI, SGL):
```
core/providers/<name>/
├── <name>.go              # Minimal — constructor + delegates to openai.HandleOpenAI* functions
└── <name>_test.go         # Tests
```

**Converter Function Naming:**
- `To<ProviderName><Feature>Request()` — Bifrost schema → Provider API format
- `ToBifrost<Feature>Response()` — Provider API format → Bifrost schema
- These must be **pure transformation functions** — no HTTP calls, no logging, no side effects

### The Provider Interface

`core/schemas/provider.go` defines the `Provider` interface with **30+ methods**. Every provider must implement all of them (returning "not supported" for unsupported operations). The interface covers:

- `ListModels`, `ChatCompletion`, `ChatCompletionStream`
- `Responses`, `ResponsesStream` (OpenAI Responses API)
- `TextCompletion`, `TextCompletionStream`
- `Embedding`, `Speech`, `SpeechStream`, `Transcription`, `TranscriptionStream`
- `ImageGeneration`, `ImageGenerationStream`, `ImageEdit`, `ImageEditStream`, `ImageVariation`
- `CountTokens`
- `Batch*` (Create, List, Retrieve, Cancel, Results)
- `File*` (Upload, List, Retrieve, Delete, Content)
- `Container*` and `ContainerFile*` (Create, List, Retrieve, Delete, Content)

### Plugin System

Four plugin interfaces exist:

| Interface | Hook Methods | When Called |
|-----------|-------------|------------|
| `LLMPlugin` | `PreLLMHook`, `PostLLMHook` | Every LLM request (SDK + HTTP) |
| `MCPPlugin` | `PreMCPHook`, `PostMCPHook` | Every MCP tool execution |
| `HTTPTransportPlugin` | `HTTPTransportPreHook`, `HTTPTransportPostHook`, `HTTPTransportStreamChunkHook` | HTTP gateway only (not Go SDK) |
| `ObservabilityPlugin` | `Inject(ctx, trace)` | Async, after response written to wire |

**Key Plugin Behaviors:**
- Plugin errors are **logged as warnings**, never returned to the caller
- Pre-hooks can **short-circuit** by returning `*LLMPluginShortCircuit` (cache hit, auth failure, rate limit)
- Post-hooks receive both response and error — either can be nil. Plugins can **recover from errors** (set error to nil, provide response) or **invalidate responses** (set response to nil, provide error)
- `BifrostError.AllowFallbacks` controls whether fallback providers are tried: `nil` or `&true` = allow, `&false` = block
- `HTTPTransportStreamChunkHook` is called **per-chunk** during streaming — can modify, skip, or abort the stream

### Pool System

`core/pool/` provides `Pool[T]` with two build modes:

```go
// Production (default): zero-overhead sync.Pool wrapper
// Debug (-tags pooldebug): tracks double-release, use-after-release, leaks with stack traces
p := pool.New[MyType]("descriptive-name", func() *MyType { return &MyType{} })
obj := p.Get()
// ... use obj ...
// MUST reset ALL fields before Put — pool does not auto-reset
p.Put(obj)
```

**Acquire/Release Pattern** for types with complex reset logic (used in `schemas/plugin.go`):
```go
req := schemas.AcquireHTTPRequest()    // Get from pool, pre-allocated maps
defer schemas.ReleaseHTTPRequest(req)  // Clears all maps and fields, returns to pool
```

---

## Gotchas and Critical Patterns

### 1. Always Reset Pooled Objects Before Put

Every pooled object must have **all** fields zeroed before `pool.Put()`. Stale data leaks between requests. The debug build catches double-release and use-after-release but **not** missing resets.

```go
// WRONG — stale data from previous request leaks to next user
pool.Put(msg)

// RIGHT
msg.Response = nil
msg.Error = nil
msg.Context = nil
msg.ResponseStream = nil
pool.Put(msg)
```

### 2. Channel Lifecycle — ProviderQueue Pattern

`ProviderQueue` uses atomic flags and `sync.Once` to prevent "send on closed channel" panics:
```go
type ProviderQueue struct {
    queue      chan *ChannelMessage
    done       chan struct{}
    closing    uint32         // atomic: 0=open, 1=closing
    signalOnce sync.Once      // ensure signal fires only once
    closeOnce  sync.Once      // ensure close fires only once
}
```
Always check the atomic `closing` flag before sending. Never close a channel without this pattern.

### 3. NetworkConfig Duration Serialization

`RetryBackoffInitial` and `RetryBackoffMax` are `time.Duration` (nanoseconds) in Go but **milliseconds** (integers) in JSON. Custom `MarshalJSON`/`UnmarshalJSON` handles conversion. If adding new duration fields to any config struct, follow this pattern exactly.

### 4. ExtraHeaders — Defensive Map Copy

`NetworkConfig.ExtraHeaders` is deep-copied in `CheckAndSetDefaults()` to prevent data races between concurrent requests. Apply the same `maps.Copy()` pattern to any new map fields in config structs.

### 5. Provider Interface Has 30+ Methods

Adding a new operation type requires changes across the entire codebase:
1. Add method to `Provider` interface in `core/schemas/provider.go`
2. Implement in **all** 20+ providers (most return "not supported")
3. Add `RequestType` constant in `core/schemas/bifrost.go`
4. Add to `AllowedRequests` struct and `IsOperationAllowed()` switch
5. Add handler endpoint in `transports/bifrost-http/handlers/`
6. Wire up in `core/bifrost.go` and `core/inference.go`

### 6. OpenAI Provider Changes Cascade to 9+ Providers

Groq, Cerebras, Ollama, Perplexity, OpenRouter, Parasail, Nebius, xAI, and SGL all delegate to `openai.HandleOpenAI*` functions. **Any change to OpenAI converter logic affects all of them.** Always test broadly: `make test-core` (all providers).

### 7. Scanner Buffer Pool Has a Capacity Cap

The SSE scanner buffer pool in `core/providers/utils/utils.go` starts at 4KB. Buffers grow dynamically but those exceeding **64KB are discarded** (not returned to pool) to prevent memory bloat. Be aware when working with providers that send very large SSE events.

### 8. Plugin Execution Order is Meaningful

Pre-hooks: registration order (first registered → first to run). Post-hooks: **reverse** order. This creates "wrapping" semantics — the first plugin registered is the outermost wrapper (its pre-hook runs first, post-hook runs last). Changing registration order changes behavior.

### 9. Fallbacks Re-execute the Full Plugin Pipeline

When a provider fails and the request falls to a fallback, the **entire plugin pipeline** re-executes from scratch. Governance checks, caching, and logging all run again for each attempt. Intentional, but surprising when debugging request counts or cost tracking.

### 10. `AllowedRequests` Nil Semantics

A **nil** `*AllowedRequests` means "all operations allowed." A **non-nil** value only allows fields explicitly set to `true`. This applies to both `ProviderConfig.AllowedRequests` and `CustomProviderConfig.AllowedRequests`.

### 11. BifrostContext Reserved Keys Are Silently Dropped

When `BlockRestrictedWrites()` is active, writes to reserved keys (governance IDs, retry counts, fallback index, etc.) are **silently ignored** — no error. If your plugin needs to pass data through context, use your own custom key type.

### 12. `fasthttp`, Not `net/http`

Bifrost uses `github.com/valyala/fasthttp` for provider HTTP calls. The API is different from `net/http`:
- Use `fasthttp.AcquireRequest()`/`fasthttp.ReleaseRequest()` for lifecycle
- `fasthttp.Client` pools connections per-host (`NetworkConfig.MaxConnsPerHost`, default 5000, 30s idle)
- Request/response bodies accessed via `resp.Body()` (returns `[]byte`, not `io.Reader`)
- **Exception:** Bedrock uses `net/http` (for AWS SigV4 signing) with `http.Transport` configured for HTTP/2 multi-connection support

### 13. `sonic`, Not `encoding/json`

JSON marshaling in hot paths uses `github.com/bytedance/sonic` for performance. `core/schemas/` uses standard `encoding/json` for custom marshaling (e.g., `NetworkConfig`). Don't mix them accidentally.

### 14. Atomic Pointer for Hot Config Reload

`Bifrost` uses `atomic.Pointer` for providers and plugins lists. On updates: create new slice → atomically swap pointer. **Never mutate the slice in place** — concurrent readers would see partial state.

### 15. MCP Tool Filtering is 4 Levels Deep

Tool access follows: Global filter → Client-level filter → Tool-level filter → Per-request filter (HTTP headers). All four levels must agree for a tool to be available. Changes to filtering logic must respect this hierarchy.

### 16. `config.schema.json` is the Source of Truth

`transports/config.schema.json` (~2700 lines) is the authoritative definition for all `config.json` fields. Documentation examples must match. When adding config fields: update schema first → handlers → docs.

### 17. UI `data-testid` Attributes Are Load-Bearing

E2E tests depend on `data-testid` attributes. Convention: `data-testid="<entity>-<element>-<qualifier>"`. If you rename or remove one, search `tests/e2e/` for references. If you add new interactive elements, add `data-testid`.

### 18. E2E Tests — Never Marshal Payloads to Maps

In `tests/e2e/core/`, **never marshal API payloads to a `Record`/`Map`/plain-object and then re-serialize**. Field ordering matters for backend validation and snapshot comparisons. Construct payloads as object literals with fields in the intended order and pass directly to Playwright's `request.post({ data })`. Avoid `Object.fromEntries()`, `JSON.parse(JSON.stringify(...))` round-trips, or destructuring into an intermediate `Record<string, unknown>` — these can silently reorder fields.

---

## Testing

### LLM Tests (`core/internal/llmtests/`)

Scenario-based tests that run against **live provider APIs** with dual-API testing (Chat Completions + Responses API):

```go
func RunMyScenarioTest(t *testing.T, client *bifrost.Bifrost, ctx context.Context, cfg ComprehensiveTestConfig) {
    // Use validation presets: BasicChatExpectations(), ToolCallExpectations(), etc.
    // Use retry framework for flaky assertions
}
```

- Register in `tests.go` `testScenarios` slice
- Add `Scenarios.MyScenario` flag to `ComprehensiveTestConfig`
- Run: `make test-core PROVIDER=<name> TESTCASE=<TestName>`

### MCP Tests (`core/internal/mcptests/`)

Mock-based tests with `DynamicLLMMocker` and declarative setup:

```go
manager, mocker, ctx := SetupAgentTest(t, AgentTestConfig{
    InProcessTools:   []string{"echo", "calculator"},
    AutoExecuteTools: []string{"*"},
    MaxDepth:         5,
})
// Queue mock LLM responses, assert tool execution order
```

Categories: `agent_*_test.go`, `tool_*_test.go`, `connection_*_test.go`, `codemode_*_test.go`

Run: `make test-mcp TESTCASE=<TestName>`

### E2E Tests (`tests/e2e/`)

Playwright tests with page objects, data factories, fixtures:

- Page objects extend `BasePage`, use `getByTestId()` as primary selector strategy
- Data factories use `Date.now()` for unique names (prevents collision in parallel runs)
- Track created resources in arrays, clean up in `afterEach`
- Import `test`/`expect` from `../../core/fixtures/base.fixture` (never from `@playwright/test`)

Run: `make run-e2e FLOW=<feature>`

---

## Adding a New Provider — Full Checklist

1. Create `core/providers/<name>/` with files per the pattern (see "Provider Implementation" above)
2. Add `ModelProvider` constant in `core/schemas/bifrost.go`
3. Add to `StandardProviders` list in `core/schemas/bifrost.go`
4. Register in `core/bifrost.go` — add import + case in provider init switch
5. **UI integration** (all required):
   - `ui/lib/constants/config.ts` — model placeholder + key requirement
   - `ui/lib/constants/icons.tsx` — provider icon
   - `ui/lib/constants/logs.ts` — provider display name (2 places)
   - `docs/openapi/openapi.json` — OpenAPI spec update
   - `transports/config.schema.json` — config schema (2 locations)
6. **CI/CD**: Add env vars to `.github/workflows/pr-tests.yml` and `release-pipeline.yml` (4 jobs)
7. **Docs**: Create `docs/providers/supported-providers/<name>.mdx`
8. **Test**: `make test-core PROVIDER=<name>`

---

## Common Workflows

### Modify chat completions across all providers
1. Change types in `core/schemas/chatcompletions.go`
2. Update converter functions in each provider's `chat.go`
3. If streaming affected, update `framework/streaming/` (accumulator, delta copy)
4. Run `make test-core` (all providers)

### Add a new field to API responses
1. Add to schema type in `core/schemas/`
2. Map in provider response converter (`ToBifrost*Response`)
3. Handle in streaming accumulator if applicable
4. Update HTTP handler if field needs special serialization
5. Update `transports/config.schema.json` if configurable

### Add a new plugin
1. Create `plugins/<name>/` with its own `go.mod`
2. Implement `LLMPlugin`, `MCPPlugin`, or `HTTPTransportPlugin` interface
3. Add to `go.work`
4. Register in transport layer or Bifrost config
5. Add test targets to `Makefile`

### Modify a UI feature
1. Find workspace page: `ui/app/workspace/<feature>/`
2. Check existing `data-testid` attributes — E2E tests depend on them
3. Add `data-testid` to new interactive elements
4. Run `make run-e2e FLOW=<feature>` to verify
5. If E2E tests break, use `/e2e-test sync` to update them

---

## Key Files Quick Reference

| What | Where |
|------|-------|
| Main Bifrost struct & queuing | `core/bifrost.go` |
| Inference routing & fallbacks | `core/inference.go` |
| Provider interface (30+ methods) | `core/schemas/provider.go` |
| ModelProvider enum & context keys | `core/schemas/bifrost.go` |
| Plugin interfaces & pooled HTTP types | `core/schemas/plugin.go` |
| BifrostContext (mutable context) | `core/schemas/context.go` |
| Chat completion types | `core/schemas/chatcompletions.go` |
| Responses API types | `core/schemas/responses.go` |
| Object pool (prod + debug) | `core/pool/pool_prod.go`, `pool_debug.go` |
| Shared provider utils & SSE parsing | `core/providers/utils/utils.go` |
| Streaming accumulator | `framework/streaming/accumulator.go` |
| HTTP inference handler | `transports/bifrost-http/handlers/inference.go` |
| Governance handler | `transports/bifrost-http/handlers/governance.go` |
| Config schema (source of truth) | `transports/config.schema.json` |
| Pool debug profiler | `transports/bifrost-http/handlers/devpprof.go` |
| LLM test infrastructure | `core/internal/llmtests/` |
| MCP test infrastructure | `core/internal/mcptests/` |
| E2E test infrastructure | `tests/e2e/core/` |
| Docs navigation config | `docs/docs.json` |
| CI/CD workflows | `.github/workflows/` |

---

## Code Style

### Go
- **Formatting:** `gofmt`/`goimports`. No custom linter config.
- **Error strings:** Lowercase, no trailing punctuation (Go convention).
- **Provider types:** Prefixed with provider name in PascalCase (`AnthropicChatRequest`, `GeminiEmbeddingResponse`).
- **Converter functions:** Pure — no side effects, no logging, no HTTP.
- **Pool names:** Descriptive string passed to `pool.New()` (e.g., `"channel-message"`, `"response-stream"`).
- **Context keys:** Use `BifrostContextKey` type. Custom plugins should define their own key types to avoid collisions.

### TypeScript/React (UI)
- **Formatting:** Prettier (see `.prettierrc`)
- **Framework:** Next.js App Router
- **Styling:** Tailwind CSS with shadcn/ui components
- **State:** Redux Toolkit, Zustand
- **JSON tags:** `snake_case` matching provider API conventions

---

## Claude Code Skills

Four skills are available via `/skill-name`:

### `/docs-writer <feature-name>`
Write, update, or review Mintlify MDX documentation. Researches UI code, Go handlers, and config schema. Validates `config.json` examples against `transports/config.schema.json`. Outputs docs with Web UI / API / config.json tabs.

Variants: `/docs-writer update <doc-path>`, `/docs-writer review <doc-path>`

### `/e2e-test <feature-name>`
Create, run, debug, audit, or auto-update Playwright E2E tests.

Variants:
- `/e2e-test fix <spec>` — Debug and fix a failing test
- `/e2e-test sync` — Detect UI changes, update affected tests automatically
- `/e2e-test audit` — Scan specs for incorrect/weak assertions (P0-P6 severity scale)

### `/investigate-issue <issue-id>`
Investigate a GitHub issue from `maximhq/bifrost`. Fetches issue details, classifies by type/area, searches codebase, traces dependencies, analyzes side effects, suggests tests (LLM/MCP/E2E), and presents an implementation plan with per-change approval gates.

### `/resolve-pr-comments <pr-number>`
Systematically address unresolved PR review comments. Uses GraphQL to get unresolved threads, presents each with FIX/REPLY/SKIP options, collects fixes locally, and only posts replies **after code is pushed** to remote.

---

## Performance Benchmarks

Bifrost adds virtually zero overhead to AI requests. In sustained 5,000 RPS benchmarks:

| Metric | t3.medium | t3.xlarge | Improvement |
|--------|-----------|-----------|-------------|
| Added latency (Bifrost overhead) | 59 µs | **11 µs** | **-81%** |
| Success rate @ 5k RPS | 100% | 100% | No failed requests |
| Avg. queue wait time | 47 µs | **1.67 µs** | **-96%** |
| Avg. request latency (incl. provider) | 2.12 s | **1.61 s** | **-24%** |

**Key Performance Highlights:**
- **Perfect Success Rate** — 100% request success rate even at 5k RPS
- **Minimal Overhead** — Less than 15 µs additional latency per request
- **Efficient Queuing** — Sub-microsecond average wait times
- **Fast Key Selection** — ~10 ns to pick weighted API keys

---

## Additional Resources

- **Documentation:** https://docs.getbifrost.ai
- **Discord Community:** https://discord.gg/exN5KAydbU
- **Postman Collection:** Available in README
- **Helm Charts:** `helm-charts/` directory
- **Terraform:** `terraform/` directory for IaC deployments
