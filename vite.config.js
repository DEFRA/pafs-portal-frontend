import { cpSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vite'
import { NodePackageImporter } from 'sass-embedded'

const require = createRequire(import.meta.url)
const govukFrontendPath = dirname(
  require.resolve('govuk-frontend/package.json')
)

/**
 * Copies govuk-frontend assets (fonts, images, icons) into .public/assets/
 * and custom client images into .public/assets/images/ after each build.
 * With webpack, CopyPlugin handled this; Vite has no built-in equivalent
 * so we do it here. Runs on every build including --watch rebuilds.
 */
function copyGovukAssets() {
  return {
    name: 'copy-govuk-assets',
    closeBundle() {
      cpSync(
        resolve(govukFrontendPath, 'dist/govuk/assets'),
        resolve('.public/assets'),
        { recursive: true }
      )
      cpSync(resolve('src/client/images'), resolve('.public/assets/images'), {
        recursive: true
      })
    }
  }
}

/**
 * Inline PostCSS plugin that removes IE8/9 null-character hack media queries
 * from govuk-frontend compiled CSS. PostCSS runs after SCSS compilation but
 * before LightningCSS minification — the correct stage to strip these.
 * The @media ... (min-width: 0\0) pattern targets IE8/9 only; removing it
 * is safe and prevents LightningCSS from emitting "Invalid media query" warnings.
 */
const stripIeHacks = () => ({
  postcssPlugin: 'postcss-strip-ie-hacks',
  AtRule: {
    media(atRule) {
      if (atRule.params.includes('\\0')) {
        atRule.remove()
      }
    }
  }
})
stripIeHacks.postcss = true

export default defineConfig({
  plugins: [copyGovukAssets()],
  base: '/public',
  build: {
    outDir: '.public',
    manifest: true,
    cssMinify: 'lightningcss',
    rolldownOptions: {
      input: {
        htmlAssets: 'src/client/assets.html',
        application: 'src/client/javascripts/application.js',
        applicationCss: 'src/client/stylesheets/application.scss'
      }
    },
    sourcemap: true
  },
  css: {
    postcss: {
      plugins: [stripIeHacks]
    },
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        importers: [new NodePackageImporter()],
        loadPaths: [
          'node_modules',
          'src/client/stylesheets',
          'src/server',
          'src/server/common/components',
          'src/server/common/templates/partials'
        ],
        quietDeps: true,
        sourceMapIncludeSources: true,
        style: 'expanded'
      }
    },
    lightningcss: { errorRecovery: true }
  },
  // Dev server
  server: {}
})
