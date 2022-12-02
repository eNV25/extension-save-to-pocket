import path from 'path'
import linaria from 'linaria/rollup'
import css from 'rollup-plugin-css-only'
import alias from '@rollup/plugin-alias'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import resolve from '@rollup/plugin-node-resolve'
import webExtension from "@samrum/rollup-plugin-web-extension";
import { emptyDir } from 'rollup-plugin-empty-dir'
import zip from 'rollup-plugin-zip'
import key from './key.json' // See README on how to get a key
import manifest from './manifest.json'
import pkg from './package.json'

const isRelease = process.env.IS_RELEASE === 'true'

const projectRootDir = path.resolve(__dirname)

export default {
  output: {
    dir: 'build',
    format: 'esm',
    chunkFileNames: path.join('chunks', '[name]-[hash].js'),
  },
  onwarn: function onwarn(warning, warn) {
    if (warning.code === 'FILE_NAME_CONFLICT') return // We are require to conflict due to manifest
    warn(warning)
  },
  plugins: [
    webExtension({
      manifest: {
        ...manifest,
        version: pkg.version,
      },
    }),
    alias({
      entries: {
        actions: path.resolve(projectRootDir, 'actions.js'),
        assets: path.resolve(projectRootDir, 'assets'),
        common: path.resolve(projectRootDir, 'common'),
        components: path.resolve(projectRootDir, 'components'),
        connectors: path.resolve(projectRootDir, 'connectors'),
        containers: path.resolve(projectRootDir, 'containers'),
        pages: path.resolve(projectRootDir, 'pages'),
        _locales: path.resolve(projectRootDir, '_locales')
      },
    }),
    // Replace environment variables
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.IS_RELEASE': JSON.stringify(process.env.IS_RELEASE)
    }),
    replace({
      preventAssignment: false,
      __consumerKey__: key,
    }),
    resolve(),
    commonjs({
      exclude: '!(node_modules/**)',
    }),
    linaria(),
    json(),
    babel({
      // Do not transpile dependencies
      ignore: ['node_modules'],
      babelHelpers: 'bundled',
    }),
    css({ output: 'assets/pocket-save-extension.css' }),
    // Empties the output dir before a new build
    emptyDir(),
    copy({
      targets: [
        { src: 'assets/fonts/*', dest: 'build/assets/fonts' },
        { src: 'assets/images/*', dest: 'build/assets/images' },
        { src: '_locales/*', dest: 'build/_locales' },
      ],
      hook: 'writeBundle',
    }),
    // Outputs a zip file in ./releases
    isRelease && zip({ dir: 'releases' }),
  ],
}
