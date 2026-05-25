declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

// Declarações de tipos para vue3-apexcharts
declare module 'vue3-apexcharts' {
  import { DefineComponent } from 'vue';

  const VueApexCharts: any;
  export default VueApexCharts;
}
