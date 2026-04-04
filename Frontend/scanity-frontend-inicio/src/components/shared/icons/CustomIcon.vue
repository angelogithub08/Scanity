<template>
  <Icon
    :icon="icon"
    :width="!isNil(width) ? width : '24px'"
    :height="!isNil(height) ? height : '24px'"
    :class="!isNil(classes) ? classes : ''"
  />
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import isNil from 'lodash/isNil';

defineProps<{
  icon: string;
  width?: string;
  height?: string;
  classes?: string;
}>();
</script>
