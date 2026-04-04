<template>
  <q-drawer
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    side="right"
    bordered
    :width="400"
    class="agent-prompt-drawer"
  >
    <div class="agent-drawer-bg column full-height">
      <q-card flat class="column full-height agent-drawer-card">
        <q-card-section class="q-pa-md border-bottom">
          <div class="row items-center justify-between">
            <div class="row items-center no-wrap">
              <q-icon name="smart_toy" size="28px" color="primary" class="q-mr-sm" />
              <span class="text-h6">Assistente</span>
            </div>
            <q-btn flat dense round icon="close" @click="emit('update:modelValue', false)" />
          </div>
        </q-card-section>

        <q-scroll-area class="col q-pa-md messages-area">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="q-mb-md"
            :class="msg.role === 'user' ? 'row justify-end' : 'row justify-start'"
          >
            <div
              :class="
                msg.role === 'user'
                  ? 'agent-bubble agent-bubble-user'
                  : 'agent-bubble agent-bubble-agent'
              "
            >
              {{ msg.text }}
            </div>
          </div>
          <div v-if="agentTyping" class="row justify-start q-mb-md">
            <div class="agent-bubble agent-bubble-agent">...</div>
          </div>
        </q-scroll-area>

        <q-card-section class="q-pa-md border-top">
          <q-input
            v-model="userInput"
            placeholder="Digite sua mensagem..."
            outlined
            dense
            bg-color="white"
            @keydown.enter.prevent="sendMessage"
          >
            <template #append>
              <q-btn round dense flat icon="send" color="primary" @click="sendMessage" />
            </template>
          </q-input>
        </q-card-section>
      </q-card>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

const userInput = ref('');
const agentTyping = ref(false);
const messages = ref<Message[]>([
  {
    id: 'welcome',
    role: 'agent',
    text: 'Olá! Sou o assistente do Scanity. Por enquanto estou em modo de demonstração. Em breve você poderá interagir comigo para consultas sobre estoque, produtos e mais.',
  },
]);

function sendMessage() {
  const text = userInput.value?.trim();
  if (!text) return;

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    text,
  });
  userInput.value = '';
  agentTyping.value = true;

  // Comportamento mockado: resposta automática após breve delay
  setTimeout(() => {
    agentTyping.value = false;
    messages.value.push({
      id: `agent-${Date.now()}`,
      role: 'agent',
      text: `Você disse: "${text}". (Resposta mockada — integração com o agente em desenvolvimento.)`,
    });
  }, 800);
}
</script>

<style scoped>
.agent-drawer-bg {
  background: linear-gradient(160deg, #e8f4fc 0%, #f0e8fc 35%, #fce8f4 70%, #e8fcf4 100%);
  background-image:
    radial-gradient(circle at 20% 20%, rgba(56, 182, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 85% 15%, rgba(250, 112, 154, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 15% 85%, rgba(163, 230, 254, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(200, 230, 255, 0.12) 0%, transparent 60%);
}

.agent-drawer-card {
  background: transparent !important;
}

.messages-area {
  min-height: 200px;
  background: transparent !important;
}

.agent-prompt-drawer :deep(.q-drawer__content) {
  background: transparent !important;
}

.agent-prompt-drawer :deep(.q-scroll-area),
.agent-prompt-drawer :deep(.q-scroll-area__content) {
  background: transparent !important;
}

.agent-prompt-drawer :deep(.q-scroll-area__thumb) {
  background: rgba(0, 0, 0, 0.15);
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.agent-bubble {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  word-break: break-word;
}

.agent-bubble-user {
  background: var(--q-primary);
  color: white;
  border-radius: 16px 16px 4px 16px;
}

.agent-bubble-agent {
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  border-radius: 16px 16px 16px 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
