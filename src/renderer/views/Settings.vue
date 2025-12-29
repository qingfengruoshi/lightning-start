<template>
  <div class="settings-layout">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>{{ t('settings.title') }}</h2>
      </div>
      <nav class="sidebar-nav">
        <a 
          v-for="item in navItems" 
          :key="item.id"
          :class="{ active: currentTab === item.id || (item.id === 'search' && currentTab === 'plugin_manager') }"
          @click="currentTab = item.id"
        >
          <span class="icon">{{ item.icon }}</span>
          <span class="label">{{ item.label }}</span>
        </a>
      </nav>
    </div>
    
    <div class="content-area">
      <div class="content-header" v-if="currentTab === 'plugin_manager'">
          <button class="back-btn" @click="currentTab = 'search'">← {{ t('settings.nav.search') }}</button>
      </div>

      <div class="content-card">
        <component 
            :is="activeComponent" 
            @open-plugin-manager="currentTab = 'plugin_manager'"
        />
      </div>

      <!-- Footer with Save Button -->
      <div class="settings-footer">
          <div class="save-status" :class="{ show: showSavedMessage }">
              {{ t('settings.saved') }}
          </div>
          <button class="save-btn" @click="saveSettings" :disabled="isSaving">
              {{ isSaving ? '...' : t('settings.save') }}
          </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, provide, watch } from 'vue';
import { useI18n } from '../composables/useI18n';
import BasicSettings from '../components/settings/BasicSettings.vue';
import HotkeySettings from '../components/settings/HotkeySettings.vue';
import SearchPluginSettings from '../components/settings/SearchPluginSettings.vue';
import AdvancedSettings from '../components/settings/AdvancedSettings.vue';
import AboutSettings from '../components/settings/AboutSettings.vue';
import PluginManager from '../components/settings/PluginManager.vue';
import { IPC_CHANNELS } from '@shared/constants';
import type { Settings } from '@shared/types/settings';

const { t, setLocale } = useI18n();

const currentTab = ref('basic');
const isSaving = ref(false);
const showSavedMessage = ref(false);

const navItems = computed(() => [
  { id: 'basic', label: t('settings.nav.basic'), icon: '⚙️' },
  { id: 'hotkey', label: t('settings.nav.hotkey'), icon: '⌨️' },
  { id: 'search', label: t('settings.nav.search'), icon: '🔍' },
  { id: 'advanced', label: t('settings.nav.advanced'), icon: '🚀' },
  { id: 'about', label: t('settings.nav.about'), icon: 'ℹ️' },
]);

const activeComponent = computed(() => {
  switch (currentTab.value) {
    case 'basic': return BasicSettings;
    case 'hotkey': return HotkeySettings;
    case 'search': return SearchPluginSettings;
    case 'advanced': return AdvancedSettings;
    case 'about': return AboutSettings;
    case 'plugin_manager': return PluginManager;
    default: return BasicSettings;
  }
});

// Centralized Settings State (Draft)
const settings = reactive<Settings>({
    hotkey: '',
    theme: 'auto',
    language: 'zh-CN',
    autoStart: false,
    showTray: true,
    hideOnBlur: true,
    maxResults: 10,
    searchMode: 'fuzzy',
    customPaths: [],
    window: { width: 800, height: 600, opacity: 1, fontSize: 14 },
    plugins: {}
});

// Provide to children
provide('settings', settings);

// Helper to apply theme
function applyTheme(theme: string) {
    if (theme === 'auto') {
        delete document.documentElement.dataset.theme;
    } else {
        document.documentElement.dataset.theme = theme;
    }
}

onMounted(async () => {
    // Load initial settings
    const saved = await window.electron.invoke(IPC_CHANNELS.SETTINGS_GET);
    Object.assign(settings, saved);
    // Set initial locale
    setLocale(settings.language);
    applyTheme(settings.theme);

    // Sync from other windows
    window.electron.on('settings:updated', (newSettings: any) => {
        Object.assign(settings, newSettings);
        setLocale(newSettings.language);
        applyTheme(newSettings.theme);
    });
});
// Remove local watcher if it conflicts, or strictly rely on onMounted/IPC sync?
// The local watcher for 'settings.language' was removed previously.
// But we might want one for instant preview in Settings?
// No, user wants "Save" to apply. So only applyTheme on 'settings:updated' (which happens after save) or initial load.


// Watch locale change separately for instant UI update (optional, but good for UX)
// Actually user wants "Save needed". But for language preview usually it is instant or restart.
// Let's stick to "Switch only when saved" for consistency, BUT UI text needs to update.
// If we update `setLocale` here on draft change, it updates immediately.
// If we wait for save, the UI text remains old until save.
// Let's simulate: user changes dropdown -> settings.language = 'en'.
// Not calling setLocale yet. SAVE -> saveSettings -> setLocale('en').
// This matches "Save to apply".

async function saveSettings() {
    isSaving.value = true;
    try {
        // Save all keys. Ideally backend supports bulk, but we loop for now.
        // Order matters slightly (e.g. locale)
        // We use Promise.all for parallelism or sequential? Sequential is safer for side effects order.
        
        // 1. Save all settings atomically to prevent race conditions with broadcasted updates
        const settingsPayload = JSON.parse(JSON.stringify(settings));
        await window.electron.invoke('settings:save', settingsPayload);
        
        // Apply side effects in Renderer (Immediate feedback)
        setLocale(settings.language);
        applyTheme(settings.theme);

        // Show feedback
        showSavedMessage.value = true;
        setTimeout(() => showSavedMessage.value = false, 2000);
    } catch (error) {
        console.error('Failed to save settings:', error);
    } finally {
        isSaving.value = false;
    }
}
</script>

<style scoped>
.settings-layout {
  display: flex;
  width: 100%; /* Force full width to override #app centering */
  height: 100vh;
  background: var(--bg-primary); /* Use var */
  color: var(--text-primary);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  user-select: none;
}

.sidebar {
  width: 200px;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  padding: 24px 8px;
  border-right: none;
}

.sidebar-header {
  padding: 0 8px 24px;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sidebar-nav a {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 14px;
}

.sidebar-nav a:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-nav a.active {
  background: var(--bg-primary);
  color: #f43f5e;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.sidebar-nav a .icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.content-area {
  flex: 1;
  padding: 24px 24px 80px 24px; /* Increased bottom padding for footer */
  overflow-y: auto;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  position: relative; /* For footer positioning */
}

.content-header {
    margin-bottom: 16px;
}

.back-btn {
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
}
.back-btn:hover {
    color: var(--text-primary);
    text-decoration: underline;
}

.content-card {
    padding: 0;
    flex: 1;
}

/* Footer & Save Button */
.settings-footer {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 10;
}

.save-btn {
    background: #f43f5e;
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(244, 63, 94, 0.3);
    transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
    background: #e11d48;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(244, 63, 94, 0.4);
}

.save-btn:active:not(:disabled) {
    transform: translateY(0);
}

.save-btn:disabled {
    background: #fda4af;
    cursor: not-allowed;
    transform: none;
}

.save-status {
    font-size: 13px;
    color: #059669;
    font-weight: 500;
    opacity: 0;
    transition: opacity 0.3s;
}

.save-status.show {
    opacity: 1;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
