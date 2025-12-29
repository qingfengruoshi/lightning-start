<template>
  <div class="result-list">
    <ResultItem
      v-for="(result, index) in results"
      :key="result.id"
      :result="result"
      :selected="index === selectedIndex"
      @click="$emit('select', index)"
      ref="itemRefs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { SearchResult } from '@shared/types/plugin';
import ResultItem from './ResultItem.vue';

const props = defineProps<{
  results: SearchResult[];
  selectedIndex: number;
}>();

defineEmits<{
  select: [index: number];
}>();

const itemRefs = ref<InstanceType<typeof ResultItem>[]>([]);

watch(() => props.selectedIndex, async (newIndex) => {
    await nextTick();
    const item = itemRefs.value[newIndex];
    if (item && item.$el) {
        item.$el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
});
</script>

<style scoped>
.result-list {
  max-height: 400px;
  overflow-y: auto;
  -webkit-app-region: no-drag;
}
</style>
