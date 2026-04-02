/**
 * OpenClaude simple build script - minimal bundling with esbuild
 * Most feature-gated modules are kept external
 */

import { readFileSync, mkdirSync } from 'fs'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

mkdirSync('./dist', { recursive: true })

// All internal feature-gated patterns to mark as external
const externalPatterns = [
  // Anthropic internal packages
  '@ant/computer-use-swift',
  '@ant/computer-use-input',
  '@ant/computer-use-mcp',
  '@ant/claude-for-chrome-mcp',
  '@anthropic-ai/mcpb',
  '@anthropic-ai/sandbox-runtime',
  
  // Feature-gated internal modules
  './services/compact/reactiveCompact.js',
  './services/compact/snipProjection.js',
  './services/compact/cachedMCConfig.js',
  './services/skillSearch/**',
  './services/sessionTranscript/**',
  './services/contextCollapse/**',
  './assistant/**',
  './proactive/**',
  './server/**',
  './ssh/**',
  './daemon/**',
  './bridge/peerSessions.js',
  './jobs/classifier.js',
  './tasks/LocalWorkflowTask/**',
  './tasks/MonitorMcpTask/**',
  './tools/SendUserFileTool/prompt.js',
  './tools/WebBrowserTool/**',
  './tools/MonitorTool/**',
  './tools/WorkflowTool/**',
  './tools/ReviewArtifactTool/**',
  './utils/udsMessaging.js',
  './utils/udsClient.js',
  './utils/attributionHooks.js',
  './memdir/memoryShapeTelemetry.js',
  './skills/bundled/dream.js',
  './skills/bundled/hunter.js',
  './skills/bundled/runSkillGenerator.js',
  './components/messages/SnipBoundaryMessage.js',
  './components/messages/UserGitHubWebhookMessage.js',
  './components/messages/UserForkBoilerplateMessage.js',
  './components/messages/UserCrossSessionMessage.js',
  './components/tasks/WorkflowDetailDialog.js',
  './components/tasks/MonitorMcpDetailDialog.js',
  './components/permissions/ReviewArtifactPermissionRequest/**',
  './components/permissions/MonitorPermissionRequest/**',
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
      // Anthropic internal
      ...externalPatterns,
    ],
    plugins: [
      {
        name: 'feature-flags',
        setup(build) {
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
            namespace: 'stub',
          }))
          build.onLoad({ filter: /^react\/compiler-runtime$/, namespace: 'stub' }, () => ({
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