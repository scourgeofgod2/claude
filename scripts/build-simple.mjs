/**
 * OpenClaude simple build script - minimal bundling with esbuild
 * Most feature-gated modules are kept external using plugin
 */

import { readFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

mkdirSync('./dist', { recursive: true })

// Feature-gated module patterns (regex patterns to match and mark as external)
const featureGatedPatterns = [
  // CLI runners (not in open-source)
  /\/cli\/bg\.js$/,
  /\/cli\/handlers\//,
  /\/environment-runner\//,
  /\/self-hosted-runner\//,
  
  // Services
  /\/services\/compact\/reactiveCompact\.js$/,
  /\/services\/compact\/snipProjection\.js$/,
  /\/services\/compact\/cachedMCConfig\.js$/,
  /\/services\/skillSearch\//,
  /\/services\/sessionTranscript\//,
  /\/services\/contextCollapse\//,
  
  // Feature-gated modules
  /\/assistant\//,
  /\/proactive\//,
  /\/server\//,
  /\/ssh\//,
  /\/daemon\//,
  /\/bridge\/peerSessions\.js$/,
  /\/jobs\/classifier\.js$/,
  
  // Tasks
  /\/tasks\/LocalWorkflowTask\//,
  /\/tasks\/MonitorMcpTask\//,
  
  // Tools
  /\/tools\/SendUserFileTool\//,
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
  
  // Utils
  /\/utils\/udsMessaging\.js$/,
  /\/utils\/udsClient\.js$/,
  /\/utils\/attributionHooks\.js$/,
  /\/utils\/attributionTrailer\.js$/,
  /\/utils\/systemThemeWatcher\.js$/,
  /\/utils\/taskSummary\.js$/,
  /\/utils\/permissions\/yolo-classifier-prompts\//,
  
  // Memdir
  /\/memdir\/memoryShapeTelemetry\.js$/,
  
  // Skills
  /\/skills\/bundled\/dream\.js$/,
  /\/skills\/bundled\/hunter\.js$/,
  /\/skills\/bundled\/runSkillGenerator\.js$/,
  /\/skills\/bundled\/verify\//,
  /\/skills\/bundled\/claude-api\//,
  /\/skills\/mcpSkills\.js$/,
  
  // Components
  /\/components\/messages\/SnipBoundaryMessage\.js$/,
  /\/components\/messages\/UserGitHubWebhookMessage\.js$/,
  /\/components\/messages\/UserForkBoilerplateMessage\.js$/,
  /\/components\/messages\/UserCrossSessionMessage\.js$/,
  /\/components\/tasks\/WorkflowDetailDialog\.js$/,
  /\/components\/tasks\/MonitorMcpDetailDialog\.js$/,
  /\/components\/permissions\/ReviewArtifactPermissionRequest\//,
  /\/components\/permissions\/MonitorPermissionRequest\//,
  
  // Coordinator
  /\/coordinator\/workerAgent\.js$/,
  
  // Commands
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
  // Normalize Windows paths to Unix-style for pattern matching
  const normalizedPath = path.replace(/\\/g, '/')
  return featureGatedPatterns.some(pattern => pattern.test(normalizedPath))
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
        name: 'feature-stub-plugin',
        setup(build) {
          // Intercept ALL imports/requires to check for feature-gated modules
          build.onResolve({ filter: /.*/ }, (args) => {
            // Skip node_modules and already resolved
            if (args.path.includes('node_modules') || args.namespace === 'feature-stub') {
              return
            }
            
            // Special case: bun:bundle
            if (args.path === 'bun:bundle') {
              return { path: 'bun:bundle', namespace: 'feature-stub' }
            }
            
            // Special case: react/compiler-runtime
            if (args.path === 'react/compiler-runtime') {
              return { path: 'react/compiler-runtime', namespace: 'feature-stub' }
            }
            
            // Check if this is a feature-gated module
            // Normalize path properly for relative imports
            const fullPath = args.path.startsWith('.')
              ? resolve(args.resolveDir, args.path)
              : args.path
            
            // Test both original and normalized paths
            if (isFeatureGated(args.path) || isFeatureGated(fullPath)) {
              // Return stub with normalized absolute path
              // This prevents esbuild from trying to resolve relative paths
              return {
                path: fullPath,
                namespace: 'feature-stub',
                pluginData: { originalPath: args.path }
              }
            }
          })
          
          // Provide stub content for all feature-gated modules
          build.onLoad({ filter: /.*/, namespace: 'feature-stub' }, (args) => {
            // Special stubs
            if (args.path === 'bun:bundle') {
              return {
                contents: 'export function feature() { return false; }',
                loader: 'js',
              }
            }
            
            if (args.path === 'react/compiler-runtime') {
              return {
                contents: 'export function c(size) { return new Array(size).fill(Symbol.for("react.memo_cache_sentinel")); }',
                loader: 'js',
              }
            }
            
            // Generic stub for feature-gated modules
            const ext = args.path.split('.').pop()
            
            // For text/markdown files
            if (ext === 'txt' || ext === 'md') {
              return {
                contents: 'export default ""',
                loader: 'js',
              }
            }
            
            // For JS modules - provide empty exports
            return {
              contents: `
                // Stub for feature-gated module: ${args.path}
                export default {};
                export const feature = () => false;
              `,
              loader: 'js',
            }
          })
        },
      },
    ],
  })

  console.log(`✓ Built openclaude v${version} → dist/cli.mjs`)
} catch (error) {
  console.error('Build failed:', error)
  process.exit(1)
}