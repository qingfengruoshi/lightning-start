<template>
  <div class="result-item" :class="{ selected }">
    <div class="result-icon">
      <img 
        v-if="result.icon && !imageError" 
        :src="result.icon" 
        alt="" 
        @error="handleImageError"
      />
      <span v-else class="emoji-icon">📄</span>
    </div>
    <div class="result-content">
      <div class="result-title">{{ result.title }}</div>
      <div v-if="result.subtitle" class="result-subtitle">{{ result.subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SearchResult } from '@shared/types/plugin';

const props = defineProps<{
  result: SearchResult;
  selected: boolean;
}>();

const imageError = ref(false);

// Reset error state when icon changes
watch(() => props.result.icon, () => {
    imageError.value = false;
});

function handleImageError() {
    imageError.value = true;
}
</script>

<style scoped>
.result-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  gap: 16px;
  height: 72px; /* Increased to 72px */
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.result-item:hover {
  background: var(--bg-hover);
}

.result-item.selected {
  background: var(--bg-selected);
}

.result-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.result-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.emoji-icon {
  font-size: 28px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 15px;
  line-height: 1.2; /* Explicit line height */
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-subtitle {
  font-size: 13px;
  line-height: 1.2; /* Explicit line height */
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0; /* Removed top margin to center strictly */
}
</style>
