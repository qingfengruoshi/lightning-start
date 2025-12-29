<template>
  <div class="app-container" ref="appContainerRef">
    <div class="search-container">
       <SearchBar 
         ref="searchBarRef" 
         v-model="searchQuery" 
         :placeholder="placeholder"
         @open-settings="openSettings"
       />
      <ResultList 
        v-if="searchResults.length > 0"
        :results="searchResults"
        :selected-index="selectedIndex"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import ResultList from '../components/ResultList.vue';
import { useSearch } from '../composables/useSearch';
import { useKeyboard } from '../composables/useKeyboard';
import { IPC_CHANNELS } from '@shared/constants';

const searchQuery = ref('');
const {  searchResults, selectedIndex, search, selectNext, selectPrev, executeAction } = useSearch();

// 监听搜索输入
watch(searchQuery, (query) => {
  if (!query) {
      // Immediate reset if query is empty
      window.electron.send('window:resize', SEARCH_BAR_HEIGHT);
  }
  search(query);
});

// 处理选择
function handleSelect(index: number) {
  console.log('[Search.vue] handleSelect called with index:', index);
  executeAction(index);
}

function openSettings() {
    window.electron.send(IPC_CHANNELS.SETTINGS_OPEN);
}

// 键盘导航
useKeyboard({
  onArrowDown: selectNext,
  onArrowUp: selectPrev,
  onEnter: () => handleSelect(selectedIndex.value),
  onEscape: () => window.electron.send('window:hide'),
});

// 监听清空事件
window.electron.on('search:clear', () => {
  searchQuery.value = '';
  search('');
});
// Constants based on CSS
const ITEM_HEIGHT = 72; // Matches ResultItem.vue height
const SEARCH_BAR_HEIGHT = 60; // 20px padding * 2 + 20px content approx
const MAX_HEIGHT = 600;

const searchBarRef = ref();

// Calculate height based on data, not DOM
function updateWindowHeight() {
    const count = searchResults.value.length;
    let height = SEARCH_BAR_HEIGHT;
    
    if (count > 0) {
        height += count * ITEM_HEIGHT;
    }
    
    // Cap at max height
    height = Math.min(height, MAX_HEIGHT);
    
    console.log(`[Search.vue] Calculated height: ${height} (items: ${count})`);
    window.electron.send('window:resize', height);
}

// Watch results to trigger calculation
watch(() => searchResults.value.length, () => {
    // Determine height immediately
    updateWindowHeight();
});

// Also update on mount to reset
onMounted(() => {
    updateWindowHeight();

  // 监听窗口显示事件，清空搜索框
  window.electron.on('window:show', () => {
    searchQuery.value = '';
    search('');
    // Reset height on show
    window.electron.send('window:resize', SEARCH_BAR_HEIGHT);
  });

  // 监听样式更新
  window.electron.on('window:style-update', (styles: any) => {
      if (styles.width) {
          containerStyle.value.width = `${styles.width}px`;
      }
      if (styles.fontSize) {
          // 更新根元素字体大小或特定元素
          document.documentElement.style.setProperty('--base-font-size', `${styles.fontSize}px`);
      }
  });

  // 初始化获取设置
  window.electron.invoke(IPC_CHANNELS.SETTINGS_GET).then((settings: any) => {
      // Apply saved language or fallback to default
      updateLocale(settings.language || 'zh-CN');

      if (settings.theme) {
           if (settings.theme === 'auto') {
             delete document.documentElement.dataset.theme;
         } else {
             document.documentElement.dataset.theme = settings.theme;
         }
      }
  });
});

const containerStyle = ref({
    width: '800px',
});

// Localization logic (simplified for Search.vue)
import zhCN from '../locales/zh-CN';
import en from '../locales/en';

const placeholder = ref('搜索应用、文件或执行命令...');
const locales: Record<string, any> = { 'zh-CN': zhCN, 'en': en };
console.log('[Search.vue] Locales loaded:', Object.keys(locales), locales['zh-CN']?.search?.placeholder, locales['en']?.search?.placeholder);
const currentLocale = ref('zh-CN');

function updateLocale(lang: string) {
    currentLocale.value = lang;
    const t = locales[lang] || locales['en'];
    // Access default export structure: default.settings.search.placeholder
    // Wait, locales[lang] IS the default export object if imported like `import zhCN from ...`.
    // zhCN structure is { settings: { ... } }
    if (t && t.settings && t.settings.search && t.settings.search.placeholder) {
        placeholder.value = t.settings.search.placeholder;
    } else {
        console.warn('[Search.vue] Placeholder not found in locale', lang, t);
    }
}

// 监听设置更新
window.electron.on('settings:updated', (newSettings: any) => {
    if (newSettings.language) {
        updateLocale(newSettings.language);
    }
    if (newSettings.theme) {
         if (newSettings.theme === 'auto') {
             delete document.documentElement.dataset.theme;
         } else {
             document.documentElement.dataset.theme = newSettings.theme;
         }
    }
    if (newSettings.window) {
         if (newSettings.window.width) containerStyle.value.width = `${newSettings.window.width}px`;
         if (newSettings.window.fontSize) document.documentElement.style.setProperty('--base-font-size', `${newSettings.window.fontSize}px`);
    }
});
</script>

<style scoped>
.app-container {
  width: v-bind('containerStyle.width');
  max-height: 600px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.search-container {
  display: flex;
  flex-direction: column;
}

.search-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    padding: 0;
}
</style>
