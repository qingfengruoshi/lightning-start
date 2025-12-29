<template>
  <div class="settings-panel">
    <div class="section-title">插件中心</div>
    
    <div class="tabs">
        <button 
            :class="{ active: activeTab === 'installed' }" 
            @click="activeTab = 'installed'"
        >已安装</button>
        <button 
            :class="{ active: activeTab === 'market' }" 
            @click="activeTab = 'market'"
        >插件市场</button>
        <button 
            :class="{ active: activeTab === 'local' }" 
            @click="activeTab = 'local'"
        >本地插件</button>
    </div>

    <div v-if="activeTab === 'installed'" class="plugin-list">
        <div v-for="plugin in plugins" :key="plugin.name" class="plugin-card">
            <div class="plugin-info">
                <div class="plugin-icon">{{ plugin.icon || '🧩' }}</div>
                <div>
                    <h4>{{ getLocalizedName(plugin) }}</h4>
                    <p>{{ getLocalizedDesc(plugin) }}</p>
                </div>
            </div>
            <div class="plugin-actions">
               <label class="switch">
                  <input type="checkbox" v-model="plugin.enabled" @change="togglePlugin(plugin)">
                  <span class="slider round"></span>
                </label>
            </div>
        </div>
    </div>

    <div v-else class="placeholder">
        <p>功能开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IPC_CHANNELS } from '@shared/constants';

import { useI18n } from '../../composables/useI18n';

interface PluginInfo {
    name: string;
    description: string;
    enabled: boolean;
    icon?: string;
}

const activeTab = ref('installed');
const plugins = ref<PluginInfo[]>([]);
const { t } = useI18n();

// Mapping for plugin names to translation keys
const pluginNameMap: Record<string, string> = {
    'app-search': 'settings.plugins.names.appSearch',
    'calculator': 'settings.plugins.names.calculator',
    'system': 'settings.plugins.names.system',
    'Clipboard History': 'settings.plugins.names.clipboard'
};

function getLocalizedName(plugin: PluginInfo): string {
    const key = pluginNameMap[plugin.name];
    if (key) {
        const translated = t(key);
        // If translation returns key (fallback), show original name
        return translated === key ? plugin.name : translated;
    }
    return plugin.name;
}

function getLocalizedDesc(plugin: PluginInfo): string {
    // Optional: map descriptions too if needed, or just leave as is for now
    return plugin.description; 
}

onMounted(async () => {
    try {
        plugins.value = await window.electron.invoke(IPC_CHANNELS.PLUGIN_LIST);
    } catch (e) {
        console.error('Failed to load plugins:', e);
        // Mock data if failed or empty for testing display
        if (plugins.value.length === 0) {
             plugins.value = [
                 { name: 'Calculator', description: 'Built-in calculator', enabled: true, icon: '🧮' },
                 { name: 'App Search', description: 'Search applications', enabled: true, icon: '🔍' }
             ];
        }
    }
});

async function togglePlugin(plugin: PluginInfo) {
    const settings = await window.electron.invoke(IPC_CHANNELS.SETTINGS_GET);
    if (!settings.plugins) settings.plugins = {};
    if (!settings.plugins[plugin.name]) settings.plugins[plugin.name] = { enabled: true, config: {} };
    
    settings.plugins[plugin.name].enabled = plugin.enabled;
    await window.electron.invoke(IPC_CHANNELS.SETTINGS_SET, 'plugins', settings.plugins);
}
</script>

<style scoped>
.settings-panel {
    max-width: 100%;
    margin: 0;
    font-family: inherit;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #111827;
}

.tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    padding: 4px;
    background: #f3f4f6;
    border-radius: 12px;
    width: fit-content;
}

.tabs button {
    background: none;
    border: none;
    padding: 8px 20px;
    color: #6b7280;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.2s;
}

.tabs button.active {
    background: white;
    color: #111827;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.plugin-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.plugin-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #f3f4f6;
    transition: all 0.2s;
}

.plugin-card:hover {
    border-color: #e5e7eb;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.plugin-info {
    display: flex;
    gap: 16px;
    align-items: center;
}

.plugin-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    border-radius: 12px;
}

h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

p {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
}

.placeholder {
    padding: 60px;
    text-align: center;
    color: #9ca3af;
    background: #f9fafb;
    border-radius: 12px;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e5e7eb;
  transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
input:checked + .slider { background-color: #2563eb; }
input:checked + .slider:before { transform: translateX(20px); }
</style>
