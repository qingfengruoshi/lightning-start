<template>
  <div 
    v-if="visible" 
    class="context-menu-mask"
    @click.stop="close"
    @contextmenu.prevent="close"
  >
    <div 
      class="context-menu" 
      :style="positionStyle"
      @click.stop
    >
      <div 
        v-for="(option, index) in options" 
        :key="index"
        class="menu-item"
        :class="{ 'danger': option.danger }"
        @click="handleSelect(option)"
      >
        <span class="label">{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  options: Array<{ label: string; action: string; danger?: boolean }>;
}>();

const emit = defineEmits<{
  (e: 'select', option: any): void;
  (e: 'close'): void;
}>();

const positionStyle = computed(() => {
  // Basic boundary check could be improved, but for now absolute positioning
  // We offset slightly so it doesn't appear exactly under the cursor click which can be annoying
  return {
    left: `${props.x}px`,
    top: `${props.y}px`
  };
});

function handleSelect(option: any) {
  emit('select', option);
  emit('close');
}

function close() {
  emit('close');
}
</script>

<style scoped>
.context-menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  /* Transparent mask to catch clicks outside */
}

.context-menu {
  position: fixed;
  min-width: 120px;
  background: var(--bg-primary);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.15s cubic-bezier(0.2, 0, 0.13, 1.5);
  transform-origin: top left;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item.danger {
  color: #ff5252;
}

.menu-item.danger:hover {
  background: rgba(255, 82, 82, 0.15);
}
</style>
