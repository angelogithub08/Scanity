import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Log } from 'src/interfaces/logs';
import { ref } from 'vue';

export const useLogsStore = defineStore('logs', () => {
  const currentLog = ref<Partial<Log>>();
  const logs = ref<Partial<Log>[]>([]);

  function setCurrentLog(data: Partial<Log>) {
    currentLog.value = data;
  }

  function setLogs(data: Partial<Log>[]) {
    logs.value = data;
  }

  return { logs, setLogs, currentLog, setCurrentLog };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLogsStore, import.meta.hot));
}
