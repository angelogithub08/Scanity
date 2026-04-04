// src/boot/apexcharts.ts
import { boot } from 'quasar/wrappers';
import { vMaska } from 'maska/vue';

// Mais informações em: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  app.directive('maska', vMaska);
});
