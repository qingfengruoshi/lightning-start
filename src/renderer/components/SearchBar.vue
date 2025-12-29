<template>
  <div class="search-bar">
  <div 
    class="search-icon"
    @click="$emit('open-settings')"
  >🔍</div>
    <input
      ref="inputRef"
      type="text"
      class="search-input"
      :value="modelValue"
      @input="handleInput"
      :placeholder="placeholder || 'Search...'"
      autofocus
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'open-settings': [];
}>();

const inputRef = ref<HTMLInputElement>();

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  padding: 16px; /* Reduced from 20px to fit 60px height constraint */
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  -webkit-app-region: no-drag;
}

.search-icon:hover {
  color: var(--text-primary);
}

.search-input {
  flex: 1;
  font-size: 18px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  -webkit-app-region: no-drag;
}

.search-input::placeholder {
  color: var(--text-muted);
}
</style>
