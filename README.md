# @jsonms/vue3

[![npm version](https://badge.fury.io/js/@jsonms%2Fvue3.svg)](https://www.npmjs.com/package/@jsonms/vue3)

A Vue3 wrapper for [@jsonms/js](https://github.com/JSON-ms/js).

## Installation

You can install `@jsonms/vue3` via npm:

```sh
npm install @jsonms/vue3
```

or using yarn:

```sh
yarn add @jsonms/vue3
```

## Synchronize with JSON.ms

1. Create a `/src/jms` folder.
2. Go on https://json.ms, open and sync your project with this newly created folder. 

## Connect with local project

Create a file `jsonms.ts` in `/src/plugins`. Make sure you synced your blueprints from JSON.ms in your `/src/jms` folder first.

```ts
import { inject } from "vue";
import { data, type JmsSectionKey, type JmsLocaleKey, type JmsData } from '@/jms';
import JsonMs, { type JSONmsProvider } from '@jsonms/vue3';

const provider = JsonMs<JmsData, JmsSectionKey, JmsLocaleKey>({
  defaultData: data as unknown as JmsData,
  defaultLocale: 'en-US',
  defaultSection: { name: 'home', paths: [] },
  
  // Optional:
  // defaultSettings: (settings: JmsSettings) => void, // Set the default settings.
  // defaultStructure: (structure: JmsStructure) => void, // Set the default structure.
})

export function useJsonMs() {
  return inject<JSONmsProvider<JmsData, JmsSectionKey, JmsLocaleKey>>('jms', provider.values);
}

export default provider;
```

### Load plugin

In `/src/plugins/index.ts`, import `jsonMs` from the plugin directory and use it within your app.

```ts
import type { App } from "vue";
import jsonMs from './jsonms'

export function registerPlugins (app: App) {
  app
    .use(jsonMs)
}
```

Make sure you have `registerPlugins(app)` in `main.ts`. Example:

```ts
import { registerPlugins } from "@/plugins";

const app = createApp(App)
registerPlugins(app);

app.mount('#app')
```

### Load in Nuxt

Create a file `jsonms.plugin.ts` in your project:

```ts
import jsonMs from './jsonms'
import { defaultData, type JmsSectionKey, type JmsLocaleKey, type JmsData } from '@/jms';

export default defineNuxtPlugin((nuxtApp) => {
  const jmsProvider = JsonMs<JmsData, JmsSectionKey, JmsLocaleKey>(defaultData);
  nuxtApp.vueApp.use(jmsProvider);
});
```

Then add it to your `nuxt.config.ts`:

```ts
plugins: [
  '~/plugins/jsonms.ts',
]
```

### Usage in templates

Now to use your data in your templates and see live updates, you need to import and execute `useJsonMs`. 

```vue
<template>
  <!-- data can contain whatever you defined in your JSON structure -->
  <h1>{{ data.key }}</h1>
</template>

<script setup lang="ts">
  import { useJsonMs } from "@/plugins/jsonms";
  const { data, locale } = useJsonMs();
</script>
```

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
