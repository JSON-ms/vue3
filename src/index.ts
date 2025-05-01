import { App, defineComponent, h, getCurrentInstance, ref, Ref, watch } from 'vue';
import { useJsonMs, JmsSection, JmsSettings, JmsStructure, JmsOptionsWithDefaults, JmsFile, defaultSettings, defaultStructure, getFilePath } from '@jsonms/js'

export {
  defaultSettings,
  defaultStructure,
  getFilePath,
  type JmsSection,
  type JmsSettings,
  type JmsOptionsWithDefaults,
  type JmsStructure,
  type JmsFile,
}

export interface JSONmsProvider<D, S, L> {
  data: Ref<D>,
  section: Ref<JmsSection<S>>,
  locale: Ref<L>,
  settings: Ref<JmsSettings>,
  structure: Ref<JmsStructure>,
  getFilePath: (file: JmsFile | null, settings?: JmsSettings) => string,
}

export interface JmsOptions {
  filePath?: string;
  targetOrigin?: string;
}

export default <D, S, L = string>(options: JmsOptionsWithDefaults<D, S, L>): {
  name: string,
  values: JSONmsProvider<D, S, L>,
  install: (app: App, options?: JmsOptions) => void,
} => {

  // Prepare ref objects
  const jsonMs = useJsonMs();
  const data = ref<D>(options.defaultData);
  const section = ref<JmsSection<S>>(options.defaultSection);
  const locale = ref<L>(options.defaultLocale);
  const settings = ref<JmsSettings>(options.defaultSettings ?? defaultSettings);
  const structure = ref<JmsStructure>(options.defaultStructure ?? defaultStructure);

  // Instantiate JsonMs
  jsonMs.bindToEditor<D, S, L>({
    onDataChange: value => data.value = value,
    onSectionInit: value => section.value = value,
    onLocaleInit: value => locale.value = value,
    onSettingsInit: value => settings.value = value,
    onStructureInit: value => structure.value = value,
    onSectionChange: value => section.value = value,
    onLocaleChange: value => locale.value = value,
    onSettingsChange: value => settings.value = value,
    onStructureChange: value => structure.value = value,
  })

  return {
    name: 'JmsProvider',
    values: {
      data: data as Ref<D>,
      section: section as Ref<JmsSection<S>>,
      locale: locale as Ref<L>,
      settings,
      structure,
      getFilePath: (file, innerSettings) => getFilePath(file, innerSettings ?? settings.value),
    },
    install(app: App, options?: JmsOptions) {

      const targetOrigin = options?.targetOrigin || '*';

      // Declare global jms property
      app.provide<JSONmsProvider<D, S, L>>('jms', {
        data: data as Ref<D>,
        locale: locale as Ref<L>,
        section: section as Ref<JmsSection<S>>,
        settings: settings as Ref<JmsSettings>,
        structure: structure as Ref<JmsStructure>,
        getFilePath: (file, innerSettings) => getFilePath(file, innerSettings ?? settings.value),
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
            const jmsData = props.modelValue.toString();
            const tempNodes = [];
            const regex = /{(.*?)}/g;
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(jmsData)) !== null) {
              const key = match[1];
              const slotContent = instance?.slots[key];

              if (lastIndex < match.index) {
                tempNodes.push(jmsData.slice(lastIndex, match.index));
              }

              if (slotContent) {
                tempNodes.push(...slotContent());
              }

              lastIndex = regex.lastIndex;
            }

            if (lastIndex < jmsData.length) {
              tempNodes.push(jmsData.slice(lastIndex));
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
      let localeTimeout: any;
      app.mixin({
        watch: {
          '$i18n.locale'(newLocale) {
            clearTimeout(localeTimeout);
            localeTimeout = setTimeout(() => {
              window.parent.postMessage({ name: 'jsonms', type: 'locale', data: newLocale }, targetOrigin);
            });
          },
          '$route'(to) {
            clearTimeout(localeTimeout);
            localeTimeout = setTimeout(() => {
              window.parent.postMessage({ name: 'jsonms', type: 'route', data: JSON.stringify({
                name: to.name,
                path: to.path,
              }) }, targetOrigin);
            });
          },
        }
      });
    }
  }
}
