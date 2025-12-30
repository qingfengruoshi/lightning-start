<template>
  <div class="history-grid" v-if="items.length > 0">
    <div class="grid-title">{{ title }}</div>
    <div class="grid-container">
      <div 
        v-for="(item, index) in items" 
        :key="item.id"
        class="grid-item"
        :class="{ 'selected': index === selectedIndex }"
        @click="handleClick(item)"
        @mouseenter="$emit('hover', index)"
        @contextmenu.prevent="handleContextMenu($event, item)"
      >
        <img :src="item.icon" class="item-icon" draggable="false" />
        <span class="item-title">{{ item.title }}</span>
      </div>
    </div>
    
    <!-- Custom Context Menu -->
    <ContextMenu 
        :visible="menuVisible"
        :x="menuX"
        :y="menuY"
        :options="menuOptions"
        @select="onMenuSelect"
        @close="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ContextMenu from './ContextMenu.vue';

const props = defineProps<{
  selectedIndex: number;
  title?: string;
}>();

const emit = defineEmits<{
  'select': [item: any];
  'hover': [index: number];
  'update-count': [count: number];
}>();

const items = ref<any[]>([]);

// Menu State
const menuVisible = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const contextItem = ref<any>(null);

const menuOptions = computed(() => [
    { 
        label: props.title === '最近使用' ? '删除' : 'Delete', 
        action: 'delete',
        danger: true 
    }
]);

async function fetchHistory() {
  try {
    const history = await window.electron.invoke('history:get');
    items.value = history || [];
    emit('update-count', items.value.length);
  } catch (e) {
    console.error('Failed to fetch history:', e);
  }
}

function handleClick(item: any) {
  emit('select', item);
}

function handleContextMenu(event: MouseEvent, item: any) {
    // Calculate position
    // We use clientX/Y but might need to adjust if it goes off screen.
    // The ContextMenu component handles basic positioning, but parent passes coordinates.
    // If the click is too close to the right edge (window width - 120px), shift left.
    const winWidth = window.innerWidth;
    const menuWidth = 120; // Approx
    
    let x = event.clientX;
    if (x + menuWidth > winWidth) {
        x = winWidth - menuWidth - 10;
    }

    menuX.value = x;
    menuY.value = event.clientY;
    contextItem.value = item;
    menuVisible.value = true;
}

function closeMenu() {
    menuVisible.value = false;
    contextItem.value = null;
}

async function onMenuSelect(option: any) {
    if (option.action === 'delete' && contextItem.value) {
        await window.electron.invoke('history:remove', contextItem.value.id);
        // Refresh handled by listener, but we can optimistically refresh too
        // Wait, the backend broadcasts 'history:updated', which we listen to.
        // So just letting that handle it is fine.
        
        // However, we should ensure the backend actually broadcasts it.
        // We modified the backend handler for menu:open-history-context previously.
        // But now we are invoking history:remove directly.
        // We need to check if history:remove handler broadcasts update.
        // Checking handlers.ts context... history:remove just calls removeHistory.
        // removeHistory in config.ts doesn't broadcast.
        // The previous implementation relied on the menu handler doing the refresh.
        // We need to manually refresh or update the backend handler.
        // Let's manually refresh here for responsiveness, and the broadcast (if added) will double check.
        // Actually, let's just create a quick direct call.
        fetchHistory();
        
        // Also broadcast to other windows? 'history:remove' in main process should probably do the broadcasting.
        // But for now, since this is renderer logic, we refresh locally.
        // If we want other windows (like settings or main if separate) to update, we'd need backend support.
        // For now, local refresh is sufficient for the immediate UX.
    }
}

onMounted(() => {
  fetchHistory();
  
  // Listen for history updates (deletion from elsewhere)
  window.electron.on('history:updated', () => {
      fetchHistory();
  });
});

defineExpose({
    refresh: fetchHistory,
    items // exposing for parent to check length
});
</script>

<style scoped>
.history-grid {
  padding: 0 16px 16px 16px;
  -webkit-app-region: no-drag; /* Ensure clicks work */
}

.grid-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  padding-left: 4px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* 5 cols for 800px width typically */
  column-gap: var(--grid-gap, 12px);
  row-gap: 12px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* Align top so icons align */
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 108px; /* Increased from 90px */
}

.grid-item:hover, .grid-item.selected {
  background-color: var(--bg-secondary);
}

.item-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  object-fit: contain;
  flex-shrink: 0;
}

.item-title {
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  width: 100%;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal; /* Allow wrapping */
  line-height: 1.3;
}
</style>
