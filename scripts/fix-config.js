const fs = require('fs');
const path = 'D:\\Development\\CodeMode\\bifrost\\config.json';

console.log('Loading config...');
const json = JSON.parse(fs.readFileSync(path, 'utf8'));

// Helper: strip props from object
function strip(obj, ...props) {
  if (!obj || typeof obj !== 'object') return;
  for (const p of props) delete obj[p];
}

// Helper: convert EnvVar object to string
function envValToStr(v) {
  if (!v || typeof v !== 'object') return v || '';
  if (v.env_var) return v.env_var;
  if (v.value) return v.value;
  return '';
}

const validAR = new Set([
  'text_completion','text_completion_stream','chat_completion','chat_completion_stream',
  'responses','responses_stream','embedding','speech','speech_stream',
  'transcription','transcription_stream','image_generation','image_generation_stream',
  'image_edit','image_edit_stream','image_variation','count_tokens','list_models'
]);

// 1. encryption_key
json.encryption_key = json.encryption_key || '';

// 2. governance null arrays -> []
if (!json.governance.model_configs) json.governance.model_configs = [];
if (!json.governance.providers) json.governance.providers = [];

// 3. rate_limits: strip additionalProperties
for (const rl of (json.governance.rate_limits || [])) {
  strip(rl, 'config_hash','created_at','updated_at');
}

// 4. routing_rules: strip additionalProperties
for (const rr of (json.governance.routing_rules || [])) {
  strip(rr, 'config_hash','created_at','updated_at');
}

// 5. teams: fix null objects, strip additionalProperties
for (const team of (json.governance.teams || [])) {
  strip(team, 'config_hash','created_at','updated_at','virtual_keys');
  if (!team.claims || typeof team.claims !== 'object') team.claims = {};
  if (!team.config || typeof team.config !== 'object') team.config = {};
  if (!team.profile || typeof team.profile !== 'object') team.profile = {};
}

// 6. customers: strip additionalProperties
for (const c of (json.governance.customers || [])) {
  strip(c, 'config_hash','created_at','updated_at','teams','virtual_keys');
}

// 7. virtual_keys: fix nulls, strip additionalProperties, fix weight null
for (const vk of (json.governance.virtual_keys || [])) {
  strip(vk, 'config_hash','created_at','updated_at');
  if (!vk.mcp_configs) vk.mcp_configs = [];
  for (const pc of (vk.provider_configs || [])) {
    if (pc.weight == null) pc.weight = 1;
  }
}

// 8. providers: strip additionalProperties, fix key values, fix allowed_requests
for (const [name, prov] of Object.entries(json.providers || {})) {
  strip(prov, 'config_hash','status');

  // Fix keys: value object -> string, strip key-level additionalProperties
  for (const key of (prov.keys || [])) {
    if (typeof key.value === 'object' && key.value) key.value = envValToStr(key.value);
    strip(key, 'status');
  }

  // Fix network_config: strip additionalProperties
  if (prov.network_config) {
    strip(prov.network_config, 'retry_backoff_initial','retry_backoff_max');
  }

  // Fix custom_provider_config.allowed_requests
  if (prov.custom_provider_config && prov.custom_provider_config.allowed_requests) {
    const ar = prov.custom_provider_config.allowed_requests;
    for (const k of Object.keys(ar)) {
      if (!validAR.has(k)) delete ar[k];
    }
  }
}

// 9. plugins: fix semantic_cache keys, fix telemetry push_gateway
for (const plugin of (json.plugins || [])) {
  if (plugin.name === 'semantic_cache' && plugin.config && plugin.config.keys) {
    for (const key of plugin.config.keys) {
      if (typeof key.value === 'object' && key.value) key.value = envValToStr(key.value);
    }
  }
  if (plugin.name === 'telemetry' && plugin.config && plugin.config.push_gateway) {
    if (!plugin.config.push_gateway.push_gateway_url) {
      plugin.config.push_gateway.push_gateway_url = '';
    }
  }
}

// 10. vector_store: fix qdrant config
if (json.vector_store && json.vector_store.config) {
  const vc = json.vector_store.config;
  strip(vc, 'https','collection_name');
  if (typeof vc.host === 'object' && vc.host) vc.host = envValToStr(vc.host);
  if (vc.port != null && typeof vc.port !== 'number') vc.port = Number(vc.port);
  if (typeof vc.api_key === 'object' && vc.api_key) vc.api_key = envValToStr(vc.api_key);
  if (vc.use_tls != null && typeof vc.use_tls !== 'boolean') vc.use_tls = Boolean(vc.use_tls);
}

// 11. MCP client_configs: fix types
if (json.mcp && json.mcp.client_configs) {
  for (const cc of json.mcp.client_configs) {
    if (typeof cc.connection_string === 'object' && cc.connection_string) {
      cc.connection_string = envValToStr(cc.connection_string);
    }
    if (cc.tool_sync_interval != null && typeof cc.tool_sync_interval !== 'string') {
      cc.tool_sync_interval = String(cc.tool_sync_interval);
    }
  }
}

// 12. auth_config: convert env_var objects to strings
if (json.auth_config) {
  if (typeof json.auth_config.admin_password === 'object' && json.auth_config.admin_password) {
    json.auth_config.admin_password = envValToStr(json.auth_config.admin_password);
  }
  if (typeof json.auth_config.admin_username === 'object' && json.auth_config.admin_username) {
    json.auth_config.admin_username = envValToStr(json.auth_config.admin_username);
  }
}

fs.writeFileSync(path, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log('Config fixed and saved!');
