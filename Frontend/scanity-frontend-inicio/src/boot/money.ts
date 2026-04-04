// src/boot/apexcharts.ts
import { boot } from 'quasar/wrappers';
import money from 'v-money3';

// Mais informações em: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  app.use(money);
});
