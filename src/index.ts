import {App, defineComponent, h, getCurrentInstance, ref, Ref, watch} from 'vue';
import { useJsonMs } from '@jsonms/js'
import {createI18n} from 'vue-i18n';
import {createRouter} from 'vue-router';

export interface JSONmsProvider<O, L, S = string> {
  data: Ref<O>,
  locale: Ref<L>,
  section: Ref<S>,
}

export interface JSONmsOptions {
  filePath?: string;
  targetOrigin?: string;
  i18n?: ReturnType<typeof createI18n>;
  router?: ReturnType<typeof createRouter>;
}

export default <O, L, S = string>(defaultJmsObject: O = {} as O) => {

  // Instantiate JsonMs
  const jsonMs = useJsonMs();
  const locale = ref<L>('en-US' as L);
  const section = ref<S>('home' as S);
  const data = ref<O>(defaultJmsObject);
  jsonMs.bindToEditor({
    onSectionChange: (value: string) => {
      section.value = value;
    },
    onLocaleChange: (value: string) => {
      locale.value = value as L;
    },
    onDataChange: (value: any) => {
      data.value = value.data;
    }
  })

  return {
    install(app: App, options?: JSONmsOptions) {

      const targetOrigin = options?.targetOrigin || '*';

      // Declare global jms property
      app.provide<JSONmsProvider<O, L, S>>('jms', {
        data: data as Ref<O>,
        locale: locale as Ref<L>,
        section: section as Ref<S>,
      });

      // JmsItem Component
      app.component('jms-item', defineComponent({
        props: {
          modelValue: {
            type: String,
            required: true
          },
          tag: {
            type: String,
            default: 'span'
          }
        },
        setup(props) {
          const instance = getCurrentInstance();
          const nodes: Ref<any[]> = ref([]);

          const updateNodes = () => {
            const jmsObject = props.modelValue.toString();
            const tempNodes = [];
            const regex = /{(.*?)}/g;
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(jmsObject)) !== null) {
              const key = match[1];
              const slotContent = instance?.slots[key];

              if (lastIndex < match.index) {
                tempNodes.push(jmsObject.slice(lastIndex, match.index));
              }

              if (slotContent) {
                tempNodes.push(...slotContent());
              }

              lastIndex = regex.lastIndex;
            }

            if (lastIndex < jmsObject.length) {
              tempNodes.push(jmsObject.slice(lastIndex));
            }

            nodes.value = tempNodes;
          };

          // Initial population of nodes
          updateNodes();

          // Watch for changes in modelValue and update nodes accordingly
          watch(() => props.modelValue, updateNodes);

          return () => {
            return h(props.tag, {}, nodes.value);
          };
        }
      }));

      // Listen to locale change
      if (options?.i18n) {
        let localeTimeout: any;
        app.mixin({
          watch: {
            '$i18n.locale'(newLocale) {
              clearTimeout(localeTimeout);
              localeTimeout = setTimeout(() => {
                window.parent.postMessage({name: 'jsonms', type: 'locale', data: newLocale}, targetOrigin);
              });
            }
          }
        });
      }

      // Listen to route change
      if (options?.router) {
        options.router.afterEach((to, from) => {
          if (from.name) {
            window.parent.postMessage({name: 'jsonms', type: 'route', data: to.name}, targetOrigin);
          }
        });
      }
    }
  }
}
