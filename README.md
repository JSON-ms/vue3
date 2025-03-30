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

## Usage

Create a file `jsonms.ts` in `/src/plugins`. Make sure to export your typings from your JSON.ms project first (See Typings under your username in JSON.ms toolbar).

```ts
import JsonMs from '@jsonms/vue3'
import { inject } from 'vue';
import { type JmsLocale, type JmsObject, defaultJmsObject } from '@/interfaces'; // Your exported typings here
import { type JSONmsProvider } from '@jsonms/vue3';

export default JsonMs<JmsObject, JmsLocale>(defaultJmsObject)

type JmsProviderSet = JSONmsProvider<JmsObject, JmsLocale, string>

export const useJsonMs = (): JmsProviderSet => {
  const jms = inject<JmsProviderSet>('jms');
  if (jms) {
    return jms;
  }
  return {
    data: ref(defaultJmsObject),
    locale: ref('en-US'),
    section: ref('home'),
  }
}
```

### Load plugin

In `/src/plugins/index.ts`, import `jsonMs` from the plugin directory and use it within your app.

```ts
import jsonMs from './jsonms'

// (Optional) If you have `vue-router` and/or `vue-i18n` installed, 
// you can pass them as parameter so JSON.ms will listen to 
// any changes and behave accordingly.
const jmsOptions = {
  router,
  i18n,
}

export function registerPlugins (app: App) {
  app
    .use(jsonMs, jmsOptions)
}
```

### Usage in templates

Now to use your data in your templates and see live updates, you need to import and execute `useJsonMs`. 

```vue
<template>
  <!-- data can contain whatever you defined in your JSON structure -->
  <h1>{{ data.key }}</h1>
</template>

<script setup lang="ts">
  import { useJsonMs } from '@/plugins/jsonms';
  const { data, locale } = useJsonMs();
</script>
```
