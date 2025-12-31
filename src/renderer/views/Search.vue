

<script setup lang="ts">
import { ref, watch, onMounted, computed, toRaw, nextTick } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import ResultList from '../components/ResultList.vue';
import HistoryGrid from '../components/HistoryGrid.vue';
import WelcomeGuide from '../components/WelcomeGuide.vue';
import { useSearch } from '../composables/useSearch';
import { useKeyboard } from '../composables/useKeyboard';
import { IPC_CHANNELS } from '@shared/constants';
import zhCN from '../locales/zh-CN';
import en from '../locales/en';

const searchQuery = ref('');
const {  searchResults, selectedIndex, search, selectNext, selectPrev, executeAction } = useSearch();

const showWelcome = ref(false);

function closeWelcome() {
    showWelcome.value = false;
    // Update setting to true
    window.electron.invoke(IPC_CHANNELS.SETTINGS_SET, 'hasSeenWelcome', true);
    console.log('[Search.vue] Closing welcome, triggering resize...');
    // Reset local container width state
    containerStyle.value.width = '800px';
    
    // Trigger resize back to normal AFTER DOM update (when search-container exists)
    nextTick(() => {
        // Force reset to search bar size
        window.electron.send('window:set-size', { width: 800, height: 60 });
        setTimeout(() => {
             updateWindowHeight();
        }, 50);
    });
}

// Watch showWelcome to resize window immediately when it appears
watch(showWelcome, (val) => {
    nextTick(() => {
        updateWindowHeight();
    });
});

// Localization
const placeholder = ref('Search apps...');
const historyTitle = ref('Recent Apps');
const locales: Record<string, any> = { 'zh-CN': zhCN, 'en': en };
const currentLocale = ref('zh-CN');

// 监听搜索输入
let debounceTimer: any = null;

// Constants based on CSS
const ITEM_HEIGHT = 72;
const SEARCH_BAR_HEIGHT = 60;
const MAX_HEIGHT = 600;

const historyGridRef = ref();
const historyCount = ref(0);
const historyVisible = computed(() => !searchQuery.value && !searchResults.value.length);
const searchBarRef = ref();
const appContainerRef = ref();
const containerStyle = ref({ width: '800px' });
const gridGap = ref(12); // Default gap

function updateLocale(lang: string) {
    currentLocale.value = lang;
    const t = locales[lang] || locales['en'];
    if (t && t.settings && t.settings.search && t.settings.search.placeholder) {
        placeholder.value = t.settings.search.placeholder;
    }
    
    // Set history title manually
    if (lang === 'zh-CN') historyTitle.value = '最近使用';
    else historyTitle.value = 'Recent Apps';
}

// 监听搜索输入
watch(searchQuery, (query) => {
  if (debounceTimer) clearTimeout(debounceTimer);

  if (!query) {
      // Immediate reset if query is empty
      window.electron.send('window:resize', SEARCH_BAR_HEIGHT);
      search('');
      return;
  }

  // Debounce search execution
  debounceTimer = setTimeout(() => {
      search(query);
  }, 100);
});

// Calculate height based on data
function updateWindowHeight() {
    // If welcome guide is visible, force a fixed height sufficient for the guide
    if (showWelcome.value) {
        // WelcomeGuide card dimensions
        const WELCOME_HEIGHT = 550;
        const WELCOME_WIDTH = 450; 
        console.log(`[Search.vue] Resizing for Welcome Guide: ${WELCOME_WIDTH}x${WELCOME_HEIGHT}`);
        
        // Use a new channel or just rely on 'window:resize' being updated/overloaded?
        // Let's overload 'window:resize' to accept options object or just handle it in main.
        // Actually main only accepts (event, height).
        // We need to change the protocol or use 'window:img-resize'? 
        // Let's assume window:resize takes (height, width?) - No it currently takes one arg.
        
        // We can send style update to force width? No that's CSS.
        // We need to change MAIN process handler or use a new event.
        // Let's use 'window:style-update' to set width in settings? No that persists it.
        
        // QUICK FIX: Send a new event 'window:set-size' { width, height }
        window.electron.send('window:set-size', { width: WELCOME_WIDTH, height: WELCOME_HEIGHT });
        // Update container style locally to match
        containerStyle.value.width = `${WELCOME_WIDTH}px`;
        return;
    }

    // Normal Search Mode
    // Ensure width is back to 800 (or user setting)
    // We should probably store the 'search mode width' in a ref to restore it.
    // For now hardcode 800 or use settings value if we had it. ContainerStyle has it.
    // But we need to tell Electron to resize window width back.
    
    // Check if we need to restore width (if it was changed)
    // Realistically, we should just enforce the standard width here.
    const SEARCH_WIDTH = 800;
    if (parseInt(containerStyle.value.width) !== SEARCH_WIDTH) {
         containerStyle.value.width = `${SEARCH_WIDTH}px`;
         window.electron.send('window:set-size', { width: SEARCH_WIDTH, height: SEARCH_BAR_HEIGHT }); // Set width immediately
    }

    let height = SEARCH_BAR_HEIGHT;

    if (searchResults.value.length > 0) {
        height += searchResults.value.length * ITEM_HEIGHT;
    } else if (historyVisible.value && historyCount.value > 0) {
        // Height = SearchBarHeight + (Math.ceil(AppsCount / Columns) * RowHeight) + Padding
        const COLUMNS = 5;
        // Fixed row gap of 12px, item height 108px
        const ROW_HEIGHT = 120; 
        const PADDING_BOTTOM = 16;
        
        const rows = Math.ceil(historyCount.value / COLUMNS);
        height += (rows * ROW_HEIGHT) + PADDING_BOTTOM;
    }
    
    // Cap at max height
    height = Math.min(height, MAX_HEIGHT);
    
    console.log(`[Search.vue] Calculated height: ${height} (results: ${searchResults.value.length}, history: ${historyCount.value})`);
    
    // Use the new channel for height too for consistency? 
    // Or old one. Old one only sets height, preserving width.
    // Since we restored width above, this is fine.
    window.electron.send('window:resize', height);
}

function handleHistoryCount(count: number) {
    historyCount.value = count;
    updateWindowHeight();
}

function handleHistorySelect(item: any) {
     console.log('History select:', item);
     const rawItem = toRaw(item);
     window.electron.invoke('action:execute', rawItem.action, rawItem);
}

// 处理选择
function handleSelect(index: number) {
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

// Watch triggers
watch(() => searchResults.value.length, updateWindowHeight);
watch(historyVisible, () => {
    if (historyVisible.value) {
        historyGridRef.value?.refresh();
    }
    updateWindowHeight();
});

// Lifecycle
onMounted(() => {
    updateWindowHeight();

  // 监听窗口显示
  window.electron.on('window:show', () => {
    searchQuery.value = '';
    search('');
    historyGridRef.value?.refresh();
  });
  
  window.electron.on('search:clear', () => {
    searchQuery.value = '';
    search('');
  });

  // 监听样式更新
  window.electron.on('window:style-update', (styles: any) => {
      if (styles.width) containerStyle.value.width = `${styles.width}px`;
      if (styles.fontSize) document.documentElement.style.setProperty('--base-font-size', `${styles.fontSize}px`);
      
      // Update Grid Gap
      if (styles.gridGap) {
          gridGap.value = styles.gridGap;
          document.documentElement.style.setProperty('--grid-gap', `${styles.gridGap}px`);
          updateWindowHeight(); // Recalculate height with new gap
      }
  });
  
  // 监听设置更新
  window.electron.on('settings:updated', (newSettings: any) => {
    if (newSettings.language) updateLocale(newSettings.language);
    if (newSettings.theme) {
         if (newSettings.theme === 'auto') delete document.documentElement.dataset.theme;
         else document.documentElement.dataset.theme = newSettings.theme;
    }
    if (newSettings.window) {
         if (newSettings.window.width) containerStyle.value.width = `${newSettings.window.width}px`;
         if (newSettings.window.fontSize) document.documentElement.style.setProperty('--base-font-size', `${newSettings.window.fontSize}px`);
         
         // Update Gap from settings
         if (newSettings.window.gridGap) {
             gridGap.value = newSettings.window.gridGap;
             document.documentElement.style.setProperty('--grid-gap', `${newSettings.window.gridGap}px`);
             // don't force update here if invisible? safe to do so.
             if (historyVisible.value) updateWindowHeight();
         }
    }
  });

  // 初始化获取设置
  window.electron.invoke(IPC_CHANNELS.SETTINGS_GET).then((settings: any) => {
      updateLocale(settings.language || 'zh-CN');
      
      // Check first run or Dev Mode
      // User requested to see it every time in dev
      if (settings.hasSeenWelcome === false || import.meta.env.DEV) {
          showWelcome.value = true;
      }

      if (settings.theme) {
           if (settings.theme === 'auto') delete document.documentElement.dataset.theme;
           else document.documentElement.dataset.theme = settings.theme;
      }
      if (settings.window) {
          if (settings.window.width) containerStyle.value.width = `${settings.window.width}px`;
          if (settings.window.gridGap) {
              gridGap.value = settings.window.gridGap;
              document.documentElement.style.setProperty('--grid-gap', `${settings.window.gridGap}px`);
          }
      }
  });
});
</script>

<template>
  <div class="app-container" ref="appContainerRef">
    <WelcomeGuide v-if="showWelcome" :visible="showWelcome" @close="closeWelcome" />
    <div class="search-container" v-else>
       <SearchBar 
         ref="searchBarRef" 
         v-model="searchQuery" 
         :placeholder="placeholder"
         @open-settings="openSettings"
       />
      <div v-if="historyVisible">
        <HistoryGrid 
          ref="historyGridRef"
          :selected-index="-1"
          :title="historyTitle"
          @select="handleHistorySelect"
          @update-count="handleHistoryCount"
        />
      </div>
      <ResultList 
        v-if="searchResults.length > 0"
        :results="searchResults"
        :selected-index="selectedIndex"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: v-bind('containerStyle.width');
  height: 100vh; /* Ensure container fills the allocated window size */
  max-height: 600px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-app-region: drag;
  box-sizing: border-box; /* Ensure padding doesn't overflow */
}

.search-container {
  display: flex;
  flex-direction: column;
}
</style>
