/**
 * OpenClaude simple build script - minimal bundling with esbuild
 * Most feature-gated modules are kept external using plugin
 */

import { readFileSync, mkdirSync } from 'fs'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

mkdirSync('./dist', { recursive: true })

// Feature-gated module patterns (regex patterns to match and mark as external)
const featureGatedPatterns = [
  /\/services\/compact\/reactiveCompact\.js$/,
  /\/services\/compact\/snipProjection\.js$/,
  /\/services\/compact\/cachedMCConfig\.js$/,
  /\/services\/skillSearch\//,
  /\/services\/sessionTranscript\//,
  /\/services\/contextCollapse\//,
  /\/assistant\//,
  /\/proactive\//,
  /\/server\//,
  /\/ssh\//,
  /\/daemon\//,
  /\/bridge\/peerSessions\.js$/,
  /\/jobs\/classifier\.js$/,
  /\/tasks\/LocalWorkflowTask\//,
  /\/tasks\/MonitorMcpTask\//,
  /\/tools\/SendUserFileTool\/prompt\.js$/,
  /\/tools\/WebBrowserTool\//,
  /\/tools\/MonitorTool\//,
  /\/tools\/WorkflowTool\//,
  /\/tools\/ReviewArtifactTool\//,
  /\/tools\/SleepTool\//,
  /\/tools\/PushNotificationTool\//,
  /\/tools\/SubscribePRTool\//,
  /\/tools\/OverflowTestTool\//,
  /\/tools\/CtxInspectTool\//,
  /\/tools\/TerminalCaptureTool\//,
  /\/tools\/SnipTool\//,
  /\/tools\/ListPeersTool\//,
  /\/tools\/DiscoverSkillsTool\//,
  /\/tools\/VerifyPlanExecutionTool\//,
  /\/utils\/udsMessaging\.js$/,
  /\/utils\/udsClient\.js$/,
  /\/utils\/attributionHooks\.js$/,
  /\/utils\/attributionTrailer\.js$/,
  /\/utils\/systemThemeWatcher\.js$/,
  /\/utils\/taskSummary\.js$/,
  /\/memdir\/memoryShapeTelemetry\.js$/,
  /\/skills\/bundled\/dream\.js$/,
  /\/skills\/bundled\/hunter\.js$/,
  /\/skills\/bundled\/runSkillGenerator\.js$/,
  /\/skills\/mcpSkills\.js$/,
  /\/components\/messages\/SnipBoundaryMessage\.js$/,
  /\/components\/messages\/UserGitHubWebhookMessage\.js$/,
  /\/components\/messages\/UserForkBoilerplateMessage\.js$/,
  /\/components\/messages\/UserCrossSessionMessage\.js$/,
  /\/components\/tasks\/WorkflowDetailDialog\.js$/,
  /\/components\/tasks\/MonitorMcpDetailDialog\.js$/,
  /\/components\/permissions\/ReviewArtifactPermissionRequest\//,
  /\/components\/permissions\/MonitorPermissionRequest\//,
  /\/coordinator\/workerAgent\.js$/,
  /\/commands\/proactive\.js$/,
  /\/commands\/assistant\//,
  /\/commands\/remoteControlServer\//,
  /\/commands\/force-snip\.js$/,
  /\/commands\/workflows\//,
  /\/commands\/subscribe-pr\.js$/,
  /\/commands\/torch\.js$/,
  /\/commands\/peers\//,
  /\/commands\/fork\//,
  /\/commands\/buddy\//,
]

// Check if a path matches any feature-gated pattern
function isFeatureGated(path) {
  return featureGatedPatterns.some(pattern => pattern.test(path))
}

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
    external: [
      // OpenTelemetry
      '@opentelemetry/*',
      // Cloud SDKs
      '@aws-sdk/*',
      '@azure/identity',
      'google-auth-library',
      // Native modules
      'audio-capture-napi',
      'audio-capture.node',
      'image-processor-napi',
      'modifiers-napi',
      'url-handler-napi',
      'color-diff-napi',
      'sharp',
      'asciichart',
      'plist',
      'cacache',
      'code-excerpt',
      'stack-utils',
      // Anthropic internal packages (exact names only, no wildcards)
      '@ant/computer-use-swift',
      '@ant/computer-use-input',
      '@ant/computer-use-mcp',
      '@ant/claude-for-chrome-mcp',
      '@anthropic-ai/mcpb',
      '@anthropic-ai/sandbox-runtime',
    ],
    plugins: [
      {
        name: 'feature-gated-externals',
        setup(build) {
          // Mark feature-gated modules as external using plugin
          build.onResolve({ filter: /\.js$/ }, (args) => {
            // Only process source files, not already external modules
            if (args.namespace !== 'file') return
            
            // Check if this path matches any feature-gated pattern
            if (isFeatureGated(args.path)) {
              return { path: args.path, external: true }
            }
          })
          
          // Stub bun:bundle
          build.onResolve({ filter: /^bun:bundle$/ }, () => ({
            path: 'bun:bundle',
            namespace: 'stub',
          }))
          build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
            contents: 'export function feature() { return false; }',
            loader: 'js',
          }))
          
          // Stub react/compiler-runtime
          build.onResolve({ filter: /^react\/compiler-runtime$/ }, () => ({
            path: 'react/compiler-runtime',
            namespace: 'stub-react',
          }))
          build.onLoad({ filter: /.*/, namespace: 'stub-react' }, () => ({
            contents: 'export function c(size) { return new Array(size).fill(Symbol.for("react.memo_cache_sentinel")); }',
            loader: 'js',
          }))
        },
      },
    ],
  })

  console.log(`✓ Built openclaude v${version} → dist/cli.mjs`)
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}