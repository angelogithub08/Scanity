// src/boot/apexcharts.ts
import { boot } from 'quasar/wrappers';
import PermissionsPlugin from 'src/plugins/permissions';

// Mais informações em: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app }) => {
  app.use(PermissionsPlugin);
});
