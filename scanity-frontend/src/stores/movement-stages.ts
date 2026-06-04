import { defineStore, acceptHMRUpdate } from 'pinia';
import type { MovementStage } from 'src/interfaces/movement-stages';
import { ref } from 'vue';

export const useMovementStagesStore = defineStore('movement-stages', () => {
  const currentMovementStage = ref<Partial<MovementStage>>();
  const movementStages = ref<Partial<MovementStage>[]>([]);

  function setCurrentMovementStage(data: Partial<MovementStage>) {
    currentMovementStage.value = data;
  }

  function setMovementStages(data: Partial<MovementStage>[]) {
    movementStages.value = data;
  }

  return { movementStages, setMovementStages, currentMovementStage, setCurrentMovementStage };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMovementStagesStore, import.meta.hot));
}
