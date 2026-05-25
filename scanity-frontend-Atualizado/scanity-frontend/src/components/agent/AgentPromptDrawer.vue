<template>
  <q-drawer
    :model-value="modelValue"
    @update:model-value="onDrawerToggle($event)"
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
            <div class="row items-center no-wrap">
              <q-btn
                flat
                dense
                round
                icon="autorenew"
                color="grey-7"
                :disable="agentTyping || loadingHistory"
                @click="confirmClearHistory"
              >
                <q-tooltip>Nova conversa</q-tooltip>
              </q-btn>
              <q-btn flat dense round icon="close" @click="emit('update:modelValue', false)" />
            </div>
          </div>
        </q-card-section>

        <q-scroll-area
          ref="scrollAreaRef"
          class="col q-pa-md messages-area"
        >
          <div v-if="loadingOlder" class="row justify-center q-mb-sm">
            <q-spinner-dots size="24px" color="primary" />
          </div>
          <div v-if="hasMoreHistory && !loadingOlder" class="row justify-center q-mb-sm">
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="expand_less"
              label="Mensagens anteriores"
              @click="loadOlderHistory()"
            />
          </div>
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
            :disable="agentTyping"
            @keydown.enter.prevent="sendMessage"
          >
            <template #append>
              <q-btn
                round
                dense
                flat
                :icon="agentTyping ? 'pending' : 'send'"
                color="primary"
                :disable="agentTyping"
                @click="sendMessage"
              />
            </template>
          </q-input>
        </q-card-section>
      </q-card>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { useChatResource } from 'src/composables/api/useChatResource';
import { useHandleException } from 'src/composables/useHandleException';

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

const $q = useQuasar();
const userInput = ref('');
const agentTyping = ref(false);
const loadingHistory = ref(false);
const loadingOlder = ref(false);
const currentPage = ref(1);
const hasMoreHistory = ref(false);
const scrollAreaRef = ref<HTMLElement | null>(null);
const messages = ref<Message[]>([]);

const chatResource = useChatResource();
const { showError } = useHandleException();
let cancelCurrent: (() => void) | null = null;

const WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'agent',
  text: 'Olá! Sou o assistente do Scanity. Pergunte sobre estoque, produtos, clientes, fornecedores e mais.',
};

function getWelcomeIfEmpty() {
  if (messages.value.length === 0) {
    messages.value = [WELCOME_MSG];
  }
}

async function loadInitialHistory() {
  loadingHistory.value = true;
  try {
    const res = await chatResource.loadHistory(1, 10);
    if (res.data.length > 0) {
      messages.value = res.data.map((m) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'agent',
        text: m.content,
      }));
      currentPage.value = 1;
      hasMoreHistory.value = res.hasMore;
    } else {
      messages.value = [WELCOME_MSG];
      hasMoreHistory.value = false;
    }
  } catch {
    messages.value = [WELCOME_MSG];
    hasMoreHistory.value = false;
  } finally {
    loadingHistory.value = false;
    scrollToBottom();
  }
}

async function loadOlderHistory() {
  if (loadingOlder.value || !hasMoreHistory.value) return;

  loadingOlder.value = true;
  const nextPage = currentPage.value + 1;

  try {
    const res = await chatResource.loadHistory(nextPage, 10);
    if (res.data.length > 0) {
      const olderMsgs = res.data.map((m) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'agent',
        text: m.content,
      } as Message));
      messages.value = [...olderMsgs, ...messages.value];
      currentPage.value = nextPage;
      hasMoreHistory.value = res.hasMore;
    }
  } catch {
    // falha silenciosa ao carregar mais
  } finally {
    loadingOlder.value = false;
  }
}

function scrollToBottom() {
  void nextTick(() => {
    const scroll = scrollAreaRef.value;
    if (scroll && typeof scroll.scrollTo === 'function') {
      scroll.scrollTo(0, scroll.scrollHeight);
    }
  });
}

function setupNativeScroll() {
  void nextTick(() => {
    const scroll = scrollAreaRef.value as {
      getScrollTarget?: () => HTMLElement;
    } | null;

    const target = scroll?.getScrollTarget?.();
    if (target) {
      target.addEventListener('scroll', handleNativeScroll, { passive: true });
    }
  });
}

function handleNativeScroll(this: HTMLElement) {
  if (this.scrollTop < 30) {
    void loadOlderHistory();
  }
}

function teardownNativeScroll() {
  const scroll = scrollAreaRef.value as {
    getScrollTarget?: () => HTMLElement;
  } | null;

  const target = scroll?.getScrollTarget?.();
  if (target) {
    target.removeEventListener('scroll', handleNativeScroll);
  }
}

onMounted(() => {
  setupNativeScroll();
});

onBeforeUnmount(() => {
  teardownNativeScroll();
});

function confirmClearHistory() {
  $q.dialog({
    title: 'Nova conversa',
    message: 'Tem certeza que deseja limpar todo o histórico?',
    ok: { label: 'Limpar', color: 'negative' },
    cancel: { label: 'Cancelar', color: 'black', flat: true },
  }).onOk(() => {
    chatResource
      .clearHistory()
      .then(() => {
        messages.value = [WELCOME_MSG];
        currentPage.value = 1;
        hasMoreHistory.value = false;
      })
      .catch((error) => {
        showError(error);
      });
  });
}

function sendMessage() {
  const text = userInput.value?.trim();
  if (!text || agentTyping.value) return;

  if (messages.value.length === 1 && messages.value[0]!.id === 'welcome') {
    messages.value = [];
  }

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    text,
  });
  userInput.value = '';
  agentTyping.value = true;
  scrollToBottom();

  const agentMsgId = `agent-${Date.now()}`;
  const agentMsg: Message = { id: agentMsgId, role: 'agent', text: '' };
  messages.value.push(agentMsg);

  cancelCurrent = chatResource.sendMessage(
    text,
    (chunk) => {
      agentMsg.text += chunk;
      scrollToBottom();
    },
    () => {
      agentTyping.value = false;
      if (!agentMsg.text.trim()) {
        agentMsg.text = 'Não obtive resposta. Tente reformular a pergunta.';
      }
    },
    (error) => {
      agentTyping.value = false;
      agentMsg.text = '';
      showError(error);
      getWelcomeIfEmpty();
    },
  );
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      void loadInitialHistory();
    } else if (cancelCurrent) {
      cancelCurrent();
      cancelCurrent = null;
      agentTyping.value = false;
    }
  },
);

function onDrawerToggle(value: boolean) {
  emit('update:modelValue', value);
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

@media (max-width: 599px) {
  .q-drawer {
    width: 100% !important;
  }
}
</style>
