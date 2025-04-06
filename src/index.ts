import {App, defineComponent, h, getCurrentInstance, ref, Ref, watch} from 'vue';
import { useJsonMs, JmsSection } from '@jsonms/js'

export interface JSONmsProvider<O, S, L = string> {
  data: Ref<O>,
  section: Ref<JmsSection<S>>,
  locale: Ref<L>,
}

export interface JSONmsOptions {
  filePath?: string;
  targetOrigin?: string;
}

export default <O, S, L = string>(
  defaultJmsObject: O = {} as O,
  defaultSection: S = 'home' as S,
  defaultLocale: L = 'en-US' as L,
) => {

  // Instantiate JsonMs
  const jsonMs = useJsonMs();
  const data = ref<O>(defaultJmsObject);
  const section = ref<JmsSection<S>>({
    name: defaultSection,
    paths: [],
  });
  const locale = ref<L>(defaultLocale);
  jsonMs.bindToEditor<S>({
    onSectionChange: (value: JmsSection<S>) => {
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
      app.provide<JSONmsProvider<O, S, L>>('jms', {
        data: data as Ref<O>,
        locale: locale as Ref<L>,
        section: section as Ref<JmsSection<S>>,
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
