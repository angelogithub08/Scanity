<template>
  <div class="rich-editor">
    <!-- Barra de ferramentas no topo -->
    <div v-if="editor" class="editor-toolbar q-pa-sm">
      <!-- Botões de cabeçalhos H1, H2, H3 -->
      <q-btn
        flat
        dense
        class="text-body1 text-bold"
        label="H1"
        :color="editor.isActive('heading', { level: 1 }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <q-tooltip>Título H1</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        class="text-body1 text-bold"
        label="H2"
        :color="editor.isActive('heading', { level: 2 }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <q-tooltip>Título H2</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        class="text-body1 text-bold"
        label="H3"
        :color="editor.isActive('heading', { level: 3 }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <q-tooltip>Título H3</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn
        flat
        dense
        round
        icon="format_bold"
        :color="editor.isActive('bold') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleBold().run()"
        :disable="!editor.can().chain().focus().toggleBold().run()"
      >
        <q-tooltip>Negrito</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_italic"
        :color="editor.isActive('italic') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleItalic().run()"
        :disable="!editor.can().chain().focus().toggleItalic().run()"
      >
        <q-tooltip>Itálico</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_underlined"
        :color="editor.isActive('underline') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleUnderline().run()"
        :disable="!editor.can().chain().focus().toggleUnderline().run()"
      >
        <q-tooltip>Sublinhado</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_strikethrough"
        :color="editor.isActive('strike') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleStrike().run()"
        :disable="!editor.can().chain().focus().toggleStrike().run()"
      >
        <q-tooltip>Tachado</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn
        flat
        dense
        round
        icon="format_align_left"
        :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().setTextAlign('left').run()"
      >
        <q-tooltip>Alinhar à esquerda</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_align_center"
        :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().setTextAlign('center').run()"
      >
        <q-tooltip>Centralizar</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_align_right"
        :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().setTextAlign('right').run()"
      >
        <q-tooltip>Alinhar à direita</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_align_justify"
        :color="editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().setTextAlign('justify').run()"
      >
        <q-tooltip>Justificar</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn
        flat
        dense
        round
        icon="format_list_bulleted"
        :color="editor.isActive('bulletList') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleBulletList().run()"
        :disable="!editor.can().chain().focus().toggleBulletList().run()"
      >
        <q-tooltip>Lista com marcadores</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="format_list_numbered"
        :color="editor.isActive('orderedList') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :disable="!editor.can().chain().focus().toggleOrderedList().run()"
      >
        <q-tooltip>Lista numerada</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="checklist"
        :color="editor.isActive('taskList') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleTaskList().run()"
        :disable="!editor.can().chain().focus().toggleTaskList().run()"
      >
        <q-tooltip>Checklist</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn
        flat
        dense
        round
        icon="format_quote"
        :color="editor.isActive('blockquote') ? 'primary' : 'grey-7'"
        @click="editor.chain().focus().toggleBlockquote().run()"
        :disable="!editor.can().chain().focus().toggleBlockquote().run()"
      >
        <q-tooltip>Citação</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced />
      <q-btn flat dense round icon="table_chart" color="grey-7" @click="createTable">
        <q-tooltip>Inserir tabela</q-tooltip>
      </q-btn>

      <q-separator vertical inset spaced />
      <q-btn
        flat
        dense
        round
        icon="format_clear"
        color="grey-7"
        @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
      >
        <q-tooltip>Limpar formatação</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="undo"
        color="grey-7"
        @click="editor.chain().focus().undo().run()"
        :disable="!editor.can().chain().focus().undo().run()"
      >
        <q-tooltip>Desfazer</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        icon="redo"
        color="grey-7"
        @click="editor.chain().focus().redo().run()"
        :disable="!editor.can().chain().focus().redo().run()"
      >
        <q-tooltip>Refazer</q-tooltip>
      </q-btn>
    </div>

    <!-- Barra de ferramentas de tabela - apenas exibida quando uma tabela está selecionada -->
    <div v-if="editor && editor.isActive('table')" class="table-toolbar q-pa-sm">
      <q-btn-group flat>
        <q-btn
          outline
          dense
          no-caps
          label="+ Coluna"
          class="q-px-md"
          color="grey-7"
          @click="editor.chain().focus().addColumnAfter().run()"
        />
        <q-btn
          outline
          dense
          no-caps
          label="- Coluna"
          class="q-px-md"
          color="negative"
          @click="editor.chain().focus().deleteColumn().run()"
        />
      </q-btn-group>

      <q-separator vertical inset spaced />

      <q-btn-group flat>
        <q-btn
          outline
          dense
          no-caps
          label="+ Linha"
          class="q-px-md"
          color="grey-7"
          @click="editor.chain().focus().addRowAfter().run()"
        />
        <q-btn
          outline
          dense
          no-caps
          label="- Linha"
          class="q-px-md"
          color="negative"
          @click="editor.chain().focus().deleteRow().run()"
        />
      </q-btn-group>

      <q-separator vertical inset spaced />

      <q-btn
        outline
        dense
        no-caps
        label="Remover Tabela"
        class="q-px-md"
        color="negative"
        @click="editor.chain().focus().deleteTable().run()"
      />

      <q-separator vertical inset spaced />

      <q-btn
        outline
        dense
        no-caps
        label="Toggle Cabeçalho"
        class="q-px-md"
        color="grey-7"
        @click="editor.chain().focus().toggleHeaderRow().run()"
      />
    </div>

    <!-- Área do editor -->
    <div class="editor-wrapper">
      <template v-if="editor">
        <editor-content :editor="editor" class="editor-content" />
      </template>
      <div v-else class="editor-content empty-editor">Carregando editor...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch, onMounted } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import 'tippy.js/dist/tippy.css';

// Expandindo as definições de tipos para o Tiptap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertTable: {
      /**
       * Insere uma tabela
       */
      insertTable: (options?: {
        rows?: number;
        cols?: number;
        withHeaderRow?: boolean;
      }) => ReturnType;
    };
  }
}

const props = defineProps({
  modelValue: {
    type: [String, null],
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Escreva seu conteúdo aqui...',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

// Função para verificar e processar conteúdo JSON
const processContent = (content: string | null) => {
  if (!content) return '';

  // Verifica se o conteúdo é um JSON
  try {
    // Se começa com { ou [, pode ser um JSON
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      const jsonData = JSON.parse(content);
      // Converte o JSON para uma representação HTML
      return `<div class="processed-json">${formatJsonAsHtml(jsonData)}</div>`;
    }
  } catch (e) {
    // Se não for um JSON válido, retorna o conteúdo original
    console.log('Não é um JSON válido:', e);
  }

  return content;
};

// Converte o JSON para HTML formatado
const formatJsonAsHtml = (json: any): string => {
  if (typeof json !== 'object' || json === null) {
    return String(json);
  }

  if (Array.isArray(json)) {
    // Se for um array, cria uma lista
    return `<ul>${json.map((item) => `<li>${formatJsonAsHtml(item)}</li>`).join('')}</ul>`;
  }

  // Se for um objeto, cria uma lista de propriedades
  const entries = Object.entries(json);
  return `<div>${entries
    .map(([key, value]) => {
      const formattedValue = formatJsonAsHtml(value);
      return `<p><strong>${key}:</strong> ${formattedValue}</p>`;
    })
    .join('')}</div>`;
};

// Lista de extensões do editor
const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
      target: '_blank',
    },
  }),
  Image,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Underline,
  Placeholder.configure({
    placeholder: props.placeholder,
  }),
  Table.configure({
    resizable: true,
    handleWidth: 5,
    cellMinWidth: 50,
    lastColumnResizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  TaskList,
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: 'task-item',
    },
  }),
];

// Inicialização do editor
const editor = useEditor({
  extensions: editorExtensions,
  content: processContent(props.modelValue),
  editable: !props.readonly,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
});

// Atualiza o editor quando o modelValue muda externamente
watch(
  () => props.modelValue,
  (newValue) => {
    const processedContent = processContent(newValue);
    const isSame = processedContent === editor.value?.getHTML();
    if (editor.value && !isSame) {
      editor.value.commands.setContent(processedContent, {
        parseOptions: {
          preserveWhitespace: 'full',
        },
      });
    }
  },
);

// Atualiza o modo editável quando o readonly muda
watch(
  () => props.readonly,
  (newValue) => {
    if (editor.value) {
      editor.value.setEditable(!newValue);
    }
  },
);

// Destrói o editor quando o componente é desmontado
onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Adicionar um callback onMount para verificar se o editor e as extensões estão funcionando corretamente
onMounted(() => {});

// Função simplificada para inserir tabela diretamente
const createTable = () => {
  if (!editor.value) return;

  // Insere a tabela diretamente com valores padrão
  editor.value
    .chain()
    .focus()
    .insertTable({
      rows: 3,
      cols: 3,
      withHeaderRow: true,
    })
    .run();
};
</script>

<style lang="scss">
.rich-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;

  .editor-wrapper {
    position: relative;
    display: flex;
  }

  .editor-content {
    background-color: white;
    border-radius: 10px;
    flex: 1;
    padding: 16px;
    min-height: 150px;
    max-height: 600px;
    overflow-y: auto;

    &:focus,
    &:focus-within {
      outline: none;
    }

    /* Remove borda azul em todos os elementos internos do editor quando em foco */
    .ProseMirror:focus,
    .ProseMirror:focus-within {
      outline: none;
      box-shadow: none;
    }

    /* Evita que os parágrafos fiquem muito pequenos */
    p,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      min-height: 26px; /* Aumentando a altura mínima para melhor alinhamento */
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      line-height: 1.5; /* Melhor espaçamento de linha */
      padding: 2px 0; /* Padding pequeno para melhorar o alinhamento */
      position: relative; /* Para posicionamento relativo */
    }

    /* Quando for o primeiro parágrafo, remove margem superior */
    p:first-child,
    h1:first-child,
    h2:first-child,
    h3:first-child,
    h4:first-child,
    h5:first-child,
    h6:first-child {
      margin-top: 0;
    }

    /* Quando for o último parágrafo, remove margem inferior */
    p:last-child,
    h1:last-child,
    h2:last-child,
    h3:last-child,
    h4:last-child,
    h5:last-child,
    h6:last-child {
      margin-bottom: 0;
    }

    p.is-editor-empty:first-child::before {
      color: #adb5bd;
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }

    a {
      text-decoration: underline;
      cursor: pointer;
    }

    img {
      max-width: 100%;
      height: auto;
    }
  }

  .editor-toolbar {
    border-bottom: 1px solid #ddd;
    background-color: #f8f9fa;
    display: flex;
    flex-wrap: wrap;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    row-gap: 4px;

    /* Estilo para grupos de botões de tabela */
    .q-btn-group {
      margin: 0 2px;
    }
  }

  /* Estilo para a barra de ferramentas de tabela */
  .table-toolbar {
    border-bottom: 1px solid #ddd;
    background-color: #f8f9fa;
    display: flex;
    flex-wrap: wrap;
    row-gap: 4px;
    padding-top: 4px;

    .q-btn-group {
      margin: 0 2px;
    }
  }
}

/* Estilos ProseMirror */
.ProseMirror {
  > * + * {
    margin-top: 0.75em;
  }

  /* Remove borda azul no ProseMirror */
  &:focus,
  &:focus-within {
    outline: none !important;
    box-shadow: none !important;
  }

  h1 {
    font-size: 2em;
    font-weight: bold;
  }

  h2 {
    font-size: 1.5em;
    font-weight: bold;
  }

  h3 {
    font-size: 1.3em;
    font-weight: bold;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid #ddd;
    color: #666;
    margin-left: 0;
    margin-right: 0;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
    font-family: monospace;
    padding: 0.25em;
    border-radius: 0.25em;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  table {
    border-collapse: collapse;
    table-layout: fixed;
    width: 100%;
    margin: 0;
    overflow: hidden;
    position: relative;

    /* Restaurando os indicadores de redimensionamento */
    .column-resize-handle {
      position: absolute;
      top: 0;
      right: -2px;
      width: 4px;
      height: 100%;
      background-color: #1976d2;
      opacity: 0;
      cursor: col-resize;
      transition: opacity 0.3s ease;
      z-index: 20;
    }

    &:hover .column-resize-handle {
      opacity: 0.3;
    }

    /* Quando estiver ativamente redimensionando */
    .column-resize-handle.dragging {
      opacity: 0.6;
      background-color: #1976d2;
    }

    td,
    th {
      min-width: 1em;
      border: 2px solid #ced4da;
      padding: 3px 5px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      font-weight: bold;
      text-align: left;
      background-color: #f1f3f5;
    }
  }
}

.processed-json {
  ul {
    padding-left: 20px;
    margin: 8px 0;
  }

  p {
    margin: 4px 0;
  }

  strong {
    font-weight: bold;
    color: #1976d2;
  }
}

/* Estilos necessários para o tippy.js funcionar corretamente */
.tippy-box {
  max-width: none !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.tippy-content {
  padding: 0 !important;
}

/* Estilos para o novo menu de comandos baseado no tippy */
.tippy-box-menu {
  width: 250px;
  padding: 8px 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid #e0e0e0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
}

.tippy-box-menuitem {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background-color 0.2s ease;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
}

.tippy-box-menuitem:hover {
  background-color: #f5f5f5;
}

.tippy-box-menuitem.is-selected {
  background-color: #e8f5fe;
  color: #1976d2;
}

.menuitem-icon {
  font-size: 18px;
  color: #1976d2;
  margin-right: 10px;
}

.menuitem-text {
  font-weight: 500;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
}

/* Estilos para TaskList (checklist) */
ul[data-type='taskList'] {
  list-style: none;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    margin-bottom: 0em;
    min-height: 24px;

    > label {
      margin-right: 0.1em;
      user-select: none;
      display: flex;
      align-items: center;
      height: 100%;
    }

    > div {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      min-height: 24px;
    }
  }

  input[type='checkbox'] {
    cursor: pointer;
    margin-right: 0.5em;
    width: 18px;
    height: 18px;
    margin-top: 0;
    margin-bottom: 0;
    vertical-align: middle;
  }
}
</style>
