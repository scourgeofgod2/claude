/**
 * OpenClaude build script — bundles the TypeScript source into a single
 * distributable JS file using esbuild.
 *
 * Handles:
 * - feature() flags → all false (disables internal-only features)
 * - MACRO.* globals → inlined version/build-time constants
 * - src/ path aliases
 */

import { readFileSync, mkdirSync } from 'fs'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

// Feature flags — all disabled for the open build.
const featureFlags = {
  VOICE_MODE: false,
  PROACTIVE: false,
  KAIROS: false,
  BRIDGE_MODE: false,
  DAEMON: false,
  AGENT_TRIGGERS: false,
  MONITOR_TOOL: false,
  ABLATION_BASELINE: false,
  DUMP_SYSTEM_PROMPT: false,
  CACHED_MICROCOMPACT: false,
  COORDINATOR_MODE: false,
  CONTEXT_COLLAPSE: false,
  COMMIT_ATTRIBUTION: false,
  TEAMMEM: false,
  UDS_INBOX: false,
  BG_SESSIONS: false,
  AWAY_SUMMARY: false,
  TRANSCRIPT_CLASSIFIER: false,
  WEB_BROWSER_TOOL: false,
  MESSAGE_ACTIONS: false,
  BUDDY: false,
  CHICAGO_MCP: false,
  COWORKER_TYPE_TELEMETRY: false,
}

// Ensure dist directory exists
mkdirSync('./dist', { recursive: true })

const internalFeatureStubModules = {
  '../daemon/workerRegistry.js': 'export async function runDaemonWorker() { throw new Error("Daemon worker is unavailable in the open build."); }',
  '../daemon/main.js': 'export async function daemonMain() { throw new Error("Daemon mode is unavailable in the open build."); }',
  '../cli/bg.js': `
export async function psHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function logsHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function attachHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function killHandler() { throw new Error("Background sessions are unavailable in the open build."); }
export async function handleBgFlag() { throw new Error("Background sessions are unavailable in the open build."); }
`,
  '../cli/handlers/templateJobs.js': 'export async function templatesMain() { throw new Error("Template jobs are unavailable in the open build."); }',
  '../environment-runner/main.js': 'export async function environmentRunnerMain() { throw new Error("Environment runner is unavailable in the open build."); }',
  '../self-hosted-runner/main.js': 'export async function selfHostedRunnerMain() { throw new Error("Self-hosted runner is unavailable in the open build."); }',
  '../services/compact/cachedMCConfig.js': 'export const cachedMCConfig = {}; export default {};',
  '../services/compact/snipProjection.js': 'export function createSnipProjection() { return null; } export default {};',
  '../services/skillSearch/featureCheck.js': 'export function checkSkillSearchFeature() { return false; } export default false;',
  '../services/skillSearch/prefetch.js': 'export function prefetchSkills() { return Promise.resolve(); } export default {};',
  '../services/skillSearch/localSearch.js': 'export function localSearch() { return []; } export default {};',
  '../services/sessionTranscript/sessionTranscript.js': 'export function getSessionTranscript() { return ""; } export default {};',
  '../services/compact/reactiveCompact.js': 'export function reactiveCompact() { return null; } export default {};',
  '../proactive/index.js': 'export const proactiveModule = null; export default null;',
  '../../proactive/index.js': 'export const proactiveModule = null; export default null;',
  './proactive/index.js': 'export const proactiveModule = null; export default null;',
  './assistant/index.js': 'export const assistantModule = null; export default null;',
  './assistant/gate.js': 'export const kairosGate = null; export default null;',
  './assistant/sessionDiscovery.js': 'export function discoverSessions() { return []; } export default {};',
  './server/parseConnectUrl.js': 'export function parseConnectUrl() { return null; } export default {};',
  './server/server.js': 'export function startServer() { throw new Error("Server is unavailable in the open build."); } export default {};',
  './server/sessionManager.js': 'export class SessionManager {} export default {};',
  './server/backends/dangerousBackend.js': 'export const dangerousBackend = null; export default null;',
  './server/serverBanner.js': 'export function showBanner() {} export default {};',
  './server/serverLog.js': 'export function logServer() {} export default {};',
  './server/lockfile.js': 'export function createLockfile() {} export function removeLockfile() {} export default {};',
  './server/connectHeadless.js': 'export function connectHeadless() { throw new Error("Headless connection is unavailable in the open build."); } export default {};',
  './ssh/createSSHSession.js': 'export function createSSHSession() { throw new Error("SSH is unavailable in the open build."); } export default {};',
  '../tools/DiscoverSkillsTool/prompt.js': 'export const DISCOVER_SKILLS_TOOL_PROMPT = ""; export default "";',
  '../SendUserFileTool/prompt.js': 'export const SEND_USER_FILE_TOOL_PROMPT = ""; export default "";',
  '../tools/SnipTool/prompt.js': 'export const SNIP_TOOL_PROMPT = ""; export default "";',
  '../../tools/TerminalCaptureTool/prompt.js': 'export const TERMINAL_CAPTURE_TOOL_PROMPT = ""; export default "";',
  './tools/SleepTool/SleepTool.js': 'export class SleepTool {} export default SleepTool;',
  './tools/MonitorTool/MonitorTool.js': 'export class MonitorTool {} export default MonitorTool;',
  './tools/SendUserFileTool/SendUserFileTool.js': 'export class SendUserFileTool {} export default SendUserFileTool;',
  './tools/PushNotificationTool/PushNotificationTool.js': 'export class PushNotificationTool {} export default PushNotificationTool;',
  './tools/SubscribePRTool/SubscribePRTool.js': 'export class SubscribePRTool {} export default SubscribePRTool;',
  './tools/OverflowTestTool/OverflowTestTool.js': 'export class OverflowTestTool {} export default OverflowTestTool;',
  '../../tools/OverflowTestTool/OverflowTestTool.js': 'export class OverflowTestTool {} export default OverflowTestTool;',
  './tools/CtxInspectTool/CtxInspectTool.js': 'export class CtxInspectTool {} export default CtxInspectTool;',
  './tools/TerminalCaptureTool/TerminalCaptureTool.js': 'export class TerminalCaptureTool {} export default TerminalCaptureTool;',
  './tools/WebBrowserTool/WebBrowserTool.js': 'export class WebBrowserTool {} export default WebBrowserTool;',
  './tools/SnipTool/SnipTool.js': 'export class SnipTool {} export default SnipTool;',
  './tools/ListPeersTool/ListPeersTool.js': 'export class ListPeersTool {} export default ListPeersTool;',
  './tools/WorkflowTool/bundled/index.js': 'export function initBundledWorkflows() {} export default {};',
  './tools/WorkflowTool/WorkflowTool.js': 'export class WorkflowTool {} export default WorkflowTool;',
  './tools/WorkflowTool/createWorkflowCommand.js': 'export function createWorkflowCommand() { return null; } export default null;',
  '../../tools/VerifyPlanExecutionTool/constants.js': 'export const VERIFY_PLAN_EXECUTION_TOOL_NAME = "verify_plan_execution"; export default {};',
  './commands/proactive.js': 'export default null;',
  './commands/assistant/index.js': 'export default null;',
  './commands/remoteControlServer/index.js': 'export default null;',
  './commands/force-snip.js': 'export default null;',
  './commands/workflows/index.js': 'export const workflowCommands = null; export default null;',
  './commands/subscribe-pr.js': 'export default null;',
  './commands/torch.js': 'export default null;',
  './commands/peers/index.js': 'export const peersCommands = null; export default null;',
  './commands/fork/index.js': 'export const forkCommands = null; export default null;',
  './commands/buddy/index.js': 'export const buddyCommands = null; export default null;',
  '../../utils/attributionHooks.js': 'export function registerAttributionHooks() {} export default {};',
  './attributionTrailer.js': 'export function buildPRTrailers() { return ""; } export default {};',
  './utils/taskSummary.js': 'export function generateTaskSummary() { return ""; } export default {};',
  '../../utils/systemThemeWatcher.js': 'export function watchSystemTheme() {} export function unwatchSystemTheme() {} export default {};',
  './jobs/classifier.js': 'export function classifyJob() { return null; } export default {};',
  '../../skills/mcpSkills.js': 'export const mcpSkills = []; export default [];',
  '../../coordinator/workerAgent.js': 'export class WorkerAgent {} export default WorkerAgent;',
}

const nativeStubModules = [
  'audio-capture-napi',
  'audio-capture.node',
  'image-processor-napi',
  'modifiers-napi',
  'url-handler-napi',
  'color-diff-napi',
  'sharp',
  '@anthropic-ai/mcpb',
  '@ant/claude-for-chrome-mcp',
  '@ant/computer-use-mcp',
  '@anthropic-ai/sandbox-runtime',
  'asciichart',
  'plist',
  'cacache',
  'fuse',
  'code-excerpt',
  'stack-utils',
]

try {
  await build({
    entryPoints: ['./src/entrypoints/cli.tsx'],
    bundle: true,
    outfile: './dist/cli.mjs',
    platform: 'node',
    target: 'node20',
    format: 'esm',
    sourcemap: true,
    minify: false,
    define: {
      'MACRO.VERSION': JSON.stringify('99.0.0'),
      'MACRO.DISPLAY_VERSION': JSON.stringify(version),
      'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'MACRO.ISSUES_EXPLAINER': JSON.stringify('report the issue at https://github.com/anthropics/claude-code/issues'),
    },
    plugins: [
      {
        name: 'feature-flags',
        setup(build) {
          // Resolve bun:bundle to feature flag shim
          build.onResolve({ filter: /^bun:bundle$/ }, () => ({
            path: 'bun:bundle',
            namespace: 'bun-bundle-shim',
          }))
          build.onLoad({ filter: /.*/, namespace: 'bun-bundle-shim' }, () => ({
            contents: `export function feature(name) { return false; }`,
            loader: 'js',
          }))

          // Resolve internal feature stub modules
          build.onResolve({ filter: /\.js$/ }, (args) => {
            if (internalFeatureStubModules[args.path]) {
              return { path: args.path, namespace: 'internal-feature-stub' }
            }
          })
          build.onLoad({ filter: /.*/, namespace: 'internal-feature-stub' }, (args) => ({
            contents: internalFeatureStubModules[args.path] || 'export {}',
            loader: 'js',
          }))

          // Resolve react/compiler-runtime
          build.onResolve({ filter: /^react\/compiler-runtime$/ }, () => ({
            path: 'react/compiler-runtime',
            namespace: 'react-compiler-shim',
          }))
          build.onLoad({ filter: /.*/, namespace: 'react-compiler-shim' }, () => ({
            contents: `export function c(size) { return new Array(size).fill(Symbol.for('react.memo_cache_sentinel')); }`,
            loader: 'js',
          }))

          // Resolve native modules to stubs
          for (const mod of nativeStubModules) {
            build.onResolve({ filter: new RegExp(`^${mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }, () => ({
              path: mod,
              namespace: 'native-stub',
            }))
          }
          build.onLoad({ filter: /.*/, namespace: 'native-stub' }, () => ({
            contents: `
const noop = () => null;
const noopClass = class {};
const handler = {
  get(_, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return new Proxy({}, handler);
    if (prop === 'ExportResultCode') return { SUCCESS: 0, FAILED: 1 };
    if (prop === 'resourceFromAttributes') return () => ({});
    if (prop === 'SandboxRuntimeConfigSchema') return { parse: () => ({}) };
    return noop;
  }
};
const stub = new Proxy(noop, handler);
export default stub;
export const __stub = true;
export const SandboxViolationStore = null;
export const SandboxManager = new Proxy({}, { get: () => noop });
export const SandboxRuntimeConfigSchema = { parse: () => ({}) };
export const BROWSER_TOOLS = [];
export const getMcpConfigForManifest = noop;
export const ColorDiff = null;
export const ColorFile = null;
export const getSyntaxTheme = noop;
export const plot = noop;
export const createClaudeForChromeMcpServer = noop;
export const ExportResultCode = { SUCCESS: 0, FAILED: 1 };
export const resourceFromAttributes = noop;
export const Resource = noopClass;
export const SimpleSpanProcessor = noopClass;
export const BatchSpanProcessor = noopClass;
export const NodeTracerProvider = noopClass;
export const BasicTracerProvider = noopClass;
export const OTLPTraceExporter = noopClass;
export const OTLPLogExporter = noopClass;
export const OTLPMetricExporter = noopClass;
export const PrometheusExporter = noopClass;
export const LoggerProvider = noopClass;
export const SimpleLogRecordProcessor = noopClass;
export const BatchLogRecordProcessor = noopClass;
export const MeterProvider = noopClass;
export const PeriodicExportingMetricReader = noopClass;
export const trace = { getTracer: () => ({ startSpan: () => ({ end: noop, setAttribute: noop, setStatus: noop, recordException: noop }) }) };
export const context = { active: noop, with: (_, fn) => fn() };
export const SpanStatusCode = { OK: 0, ERROR: 1, UNSET: 2 };
export const ATTR_SERVICE_NAME = 'service.name';
export const ATTR_SERVICE_VERSION = 'service.version';
export const SEMRESATTRS_SERVICE_NAME = 'service.name';
export const SEMRESATTRS_SERVICE_VERSION = 'service.version';
export const AggregationTemporality = { CUMULATIVE: 0, DELTA: 1 };
export const DataPointType = { HISTOGRAM: 0, SUM: 1, GAUGE: 2 };
export const InstrumentType = { COUNTER: 0, HISTOGRAM: 1, UP_DOWN_COUNTER: 2 };
export const PushMetricExporter = noopClass;
export const SeverityNumber = {};
`,
            loader: 'js',
          }))

          // Resolve .md and .txt files to empty stubs
          build.onResolve({ filter: /\.(md|txt)$/ }, (args) => ({
            path: args.path,
            namespace: 'text-stub',
          }))
          build.onLoad({ filter: /.*/, namespace: 'text-stub' }, () => ({
            contents: `export default '';`,
            loader: 'js',
          }))
        },
      },
    ],
    external: [
      '@opentelemetry/api',
      '@opentelemetry/api-logs',
      '@opentelemetry/core',
      '@opentelemetry/exporter-trace-otlp-grpc',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/exporter-trace-otlp-proto',
      '@opentelemetry/exporter-logs-otlp-http',
      '@opentelemetry/exporter-logs-otlp-proto',
      '@opentelemetry/exporter-logs-otlp-grpc',
      '@opentelemetry/exporter-metrics-otlp-proto',
      '@opentelemetry/exporter-metrics-otlp-grpc',
      '@opentelemetry/exporter-metrics-otlp-http',
      '@opentelemetry/exporter-prometheus',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/sdk-trace-node',
      '@opentelemetry/sdk-logs',
      '@opentelemetry/sdk-metrics',
      '@opentelemetry/semantic-conventions',
      '@aws-sdk/client-bedrock',
      '@aws-sdk/client-bedrock-runtime',
      '@aws-sdk/client-sts',
      '@aws-sdk/credential-providers',
      '@azure/identity',
      'google-auth-library',
    ],
  })

  console.log(`✓ Built openclaude v${version} → dist/cli.mjs`)
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}