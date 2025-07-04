import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    base: '/balcon/',
  },
  html: {
    title: 'balcón',
  },
});
