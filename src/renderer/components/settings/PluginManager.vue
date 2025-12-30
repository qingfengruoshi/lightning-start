<template>
  <div class="settings-panel">
    <div class="section-title">插件中心</div>
    
    <div class="tabs-container">
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
        <button class="reload-btn" @click="reloadPlugins" title="刷新插件">
            🔄
        </button>
    </div>

    <div v-if="activeTab === 'installed'" class="plugin-list">
        <div v-for="plugin in plugins" :key="plugin.name" class="plugin-card">
            <div class="plugin-info">
                <div class="plugin-icon">
                    <img 
                        v-if="plugin.icon && isIconPath(plugin.icon) && !failedIcons.has(plugin.id || plugin.name)" 
                        :src="plugin.icon" 
                        alt="icon"
                        @error="handleIconError(plugin.id || plugin.name)" 
                    />
                    <span v-else>{{ !isIconPath(plugin.icon || '') && plugin.icon ? plugin.icon : '🧩' }}</span>
                </div>
                <div>
                    <h4>{{ getLocalizedName(plugin) }}</h4>
                    <p>{{ getLocalizedDesc(plugin) }}</p>
                </div>
            </div>
            <div class="plugin-actions">
               <button 
                   v-if="plugin.isExternal" 
                   class="delete-btn" 
                   @click="uninstallPlugin(plugin)"
                   title="卸载"
               >
                   🗑️
               </button>
               <label class="switch">
                  <input type="checkbox" v-model="plugin.enabled" @change="togglePlugin(plugin)">
                  <span class="slider round"></span>
                </label>
            </div>
        </div>
    </div>

    <div v-else-if="activeTab === 'market'" class="plugin-list market-list">
        <div v-if="isLoadingMarket" class="status-msg">
            <div class="spinner"></div> 加载中...
        </div>
        <div v-else-if="marketError" class="status-msg error">
            {{ marketError }}
        </div>
        <div v-else v-for="plugin in marketPlugins" :key="plugin.id" class="plugin-card market-card">
            <div class="plugin-info">
                 <!-- Use remote icon if available, else letter -->
                <div class="plugin-icon">
                    <img 
                        v-if="plugin.icon && isIconPath(plugin.icon) && !failedIcons.has(plugin.id)" 
                        :src="plugin.icon" 
                        alt="icon"
                        @error="handleIconError(plugin.id)"
                    />
                    <span v-else>{{ !isIconPath(plugin.icon || '') && plugin.icon ? plugin.icon : '🧩' }}</span>
                </div>
                <div>
                    <h4>{{ plugin.name }} <span class="version">v{{ plugin.version }}</span></h4>
                    <p>{{ plugin.description }}</p>
                    <div class="meta">by {{ plugin.author }}</div>
                </div>
            </div>
            <div class="plugin-actions">
                <button 
                    class="install-btn" 
                    :class="{ 'installed': isInstalled(plugin.id) }"
                    :disabled="plugin.isInstalling || isInstalled(plugin.id)"
                    @click="installPlugin(plugin)"
                >
                    {{ plugin.isInstalling ? '安装中...' : (isInstalled(plugin.id) ? '已安装' : '安装') }}
                </button>
            </div>
        </div>
    </div>

    <div v-else-if="activeTab === 'local'" class="local-tab">
        <div class="local-actions-card">
            <div class="card-icon">📂</div>
            <div class="card-content">
                <h3>插件目录</h3>
                <p>直接管理本地插件文件</p>
                <button class="action-btn" @click="openPluginsDir">打开文件夹</button>
            </div>
        </div>

        <div class="local-actions-card">
            <div class="card-icon">📦</div>
            <div class="card-content">
                <h3>安装本地插件</h3>
                <p>选择 .zip 格式的插件包进行安装</p>
                <button class="action-btn primary" @click="installLocalPlugin">选择文件安装</button>
            </div>
        </div>

        <div class="dev-tip">
            <p>💡 提示：将解压后的插件文件夹直接放入插件目录，重启即可生效。</p>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IPC_CHANNELS } from '@shared/constants';

import { useI18n } from '../../composables/useI18n';

interface PluginInfo {
    id?: string;
    name: string;
    description: string;
    enabled: boolean;
    icon?: string;
    version?: string;
    isExternal?: boolean;
}

// ... (keep MarketPlugin interface)

// ... (keep state variables)

// ... (keep existing functions)

async function uninstallPlugin(plugin: PluginInfo) {
    if (!confirm(`确定要卸载插件 "${getLocalizedName(plugin)}" 吗？`)) return;
    try {
        await window.electron.invoke('plugin:uninstall', plugin.id);
        await reloadPlugins();
    } catch (e) {
        console.error('Uninstall failed:', e);
        alert(`卸载失败: ${e}`);
    }
}

interface MarketPlugin {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    downloadUrl: string;
    icon?: string;
    isInstalling?: boolean; // UI state
}

const activeTab = ref('installed');
const plugins = ref<PluginInfo[]>([]);
const marketPlugins = ref<MarketPlugin[]>([]);
const isLoadingMarket = ref(false);
const marketError = ref('');
const { t } = useI18n();

// Mapping for plugin names to translation keys
const pluginNameMap: Record<string, string> = {
    'app-search': 'settings.search.plugins.names.appSearch',
    'calculator': 'settings.search.plugins.names.calculator',
    'system': 'settings.search.plugins.names.system',
    'Clipboard History': 'settings.search.plugins.names.clipboard'
};

const pluginDescMap: Record<string, string> = {
    'app-search': 'settings.search.plugins.descriptions.appSearch',
    'calculator': 'settings.search.plugins.descriptions.calculator',
    'system': 'settings.search.plugins.descriptions.system',
    'Clipboard History': 'settings.search.plugins.descriptions.clipboard'
};

function getLocalizedName(plugin: PluginInfo): string {
    // Only localize known built-ins
    const key = pluginNameMap[plugin.name];
    if (key) {
        const translated = t(key);
        return translated === key ? plugin.name : translated;
    }
    return plugin.name;
}

function getLocalizedDesc(plugin: PluginInfo): string {
    const key = pluginDescMap[plugin.name];
    if (key) {
        const translated = t(key);
        return translated === key ? plugin.description : translated;
    }
    return plugin.description; 
}

// Check if a market plugin is already installed
// Check if a market plugin is already installed
function isInstalled(pluginId: string): boolean {
    console.log(`[Market] Checking isInstalled for ${pluginId}`, plugins.value.map(p => `${p.name} (${p.id})`));
    const installed = plugins.value.some(p => p.id === pluginId || p.name === pluginId);
    if (installed) {
        console.log(`[Market] Match found for ${pluginId}`);
    }
    return installed;
}

function isIconPath(icon: string): boolean {
    if (!icon) return false;
    return icon.includes('/') || icon.includes('\\') || icon.startsWith('http') || icon.startsWith('file:');
}

const failedIcons = ref(new Set<string>());

function handleIconError(pluginId: string) {
    if (pluginId) {
        failedIcons.value.add(pluginId);
    }
}

onMounted(async () => {
    await loadInstalledPlugins();
});

async function loadInstalledPlugins() {
    try {
        plugins.value = await window.electron.invoke(IPC_CHANNELS.PLUGIN_LIST);
    } catch (e) {
        console.error('Failed to load plugins:', e);
    }
}

async function loadMarketPlugins() {
    if (marketPlugins.value.length > 0) return; // Cache simple
    isLoadingMarket.value = true;
    marketError.value = '';
    try {
        marketPlugins.value = await window.electron.invoke('plugin:market-list');
    } catch (e: any) {
        console.error('Failed to load market:', e);
        marketError.value = '无法连接到插件市场';
    } finally {
        isLoadingMarket.value = false;
    }
}

// Watch tab to load market
import { watch } from 'vue';
watch(activeTab, (newTab) => {
    if (newTab === 'market') {
        loadMarketPlugins();
    }
});

async function togglePlugin(plugin: PluginInfo) {
    const settings = await window.electron.invoke(IPC_CHANNELS.SETTINGS_GET);
    if (!settings.plugins) settings.plugins = {};
    if (!settings.plugins[plugin.name]) settings.plugins[plugin.name] = { enabled: true, config: {} };
    
    settings.plugins[plugin.name].enabled = plugin.enabled;
    await window.electron.invoke(IPC_CHANNELS.SETTINGS_SET, 'plugins', settings.plugins);
}

async function reloadPlugins() {
    try {
        await window.electron.invoke('plugin:reload');
        await loadInstalledPlugins();
    } catch (e) {
        console.error('Failed to reload plugins:', e);
    }
}

async function installPlugin(plugin: MarketPlugin) {
    if (plugin.isInstalling) return;
    console.log('[Market] Starting install for:', plugin.name);
    plugin.isInstalling = true;
    try {
        console.log('[Market] Invoking IPC plugin:install', plugin);
        await window.electron.invoke('plugin:install', JSON.parse(JSON.stringify(plugin))); // Clone to be safe
        console.log('[Market] IPC call success');
        
        // Refresh installed list
        await reloadPlugins();
        // Switch tab? or just show "Installed"
        // Show success notification provided by system?
    } catch (e) {
        console.error('Install failed:', e);
        alert(`安装失败: ${e}`);
    } finally {
        plugin.isInstalling = false;
    }
}

async function openPluginsDir() {
    await window.electron.invoke('plugin:open-plugins-dir');
}

async function installLocalPlugin() {
    try {
        const result = await window.electron.invoke('plugin:install-local');
        if (result) {
            alert('安装成功！');
            await reloadPlugins();
        }
    } catch (e) {
        console.error('Local install failed:', e);
        alert(`安装失败: ${e}`);
    }
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
    color: var(--text-primary);
}

.tabs-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--bg-secondary);
    border-radius: 12px;
    width: fit-content;
}

.reload-btn {
    background: var(--bg-secondary);
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 16px;
}

.reload-btn:hover {
    background: var(--bg-hover);
    transform: rotate(180deg);
}

.tabs button {
    background: none;
    border: none;
    padding: 8px 20px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.2s;
}

.tabs button.active {
    background: var(--bg-primary);
    color: var(--text-primary);
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
    background: var(--bg-secondary); /* Use secondary or just transparent/primary? Let's use bg-secondary for cards usually on top of primary? Wait, layout background is primary. Sidebar is secondary. 
    Actually, maybe cards should be transparent or bordered? 
    Tabs background is usually distinct.
    Let's align with other settings. BasicSettings uses "settings-card" which is transparent.
    But this is a list of cards. Let's make them slightly distiguished.
    If bg-primary is main bg, then cards could be bg-secondary? Or transparent with border.
    Current hardcode: background: white (which is primary in light mode).
    let's use --bg-primary but add border.
    */
    background: var(--bg-hover); /* Or just transparent ? */
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: all 0.2s;
}
/* Wait, bg-hover is very transparent. 
Let's use a specific color or just --bg-secondary if we want it to pop from --bg-primary.
In light mode: primary=white, secondary=#f8f8f8.
If main is primary, cards should be secondary?
Or main is secondary, cards primary?
Settings layout: content-area is bg-primary.
So Cards should probably be var(--bg-secondary) or just bordered?
Let's use var(--bg-secondary) for cards to make them distinct blocks.
*/
.plugin-card {
    background: var(--bg-primary); /* Keep it clean? */
    border: 1px solid var(--border-color);
    /* ... */
}
/* Refined replacement below */

.plugin-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-primary);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    transition: all 0.2s;
}

.plugin-card:hover {
    border-color: var(--text-muted);
    box-shadow: var(--shadow);
}

.delete-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    margin-right: 8px;
    color: var(--text-secondary);
    transition: all 0.2s;
    opacity: 0.6;
}

.delete-btn:hover {
    background: #ff4d4f20;
    color: #ff4d4f;
    opacity: 1;
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
    background: var(--bg-secondary);
    border-radius: 12px;
    overflow: hidden;
}

.plugin-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 6px;
}

h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

p {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
}

.placeholder {
    padding: 60px;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-secondary);
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
  background-color: var(--border-color);
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
input:checked + .slider { background-color: var(--accent-color); }
input:checked + .slider:before { transform: translateX(20px); }

/* Market Styles */
.status-msg {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
}
.status-msg.error {
    color: #ff4d4f;
}

.version {
    font-size: 11px;
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 8px;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
}

.meta {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
}

.install-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: opacity 0.2s;
}
.install-btn:disabled, .install-btn.installed {
    opacity: 0.7;
    cursor: not-allowed;
    background: var(--bg-hover);
    color: var(--text-muted);
}

.spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0,0,0,0.1);
    border-left-color: var(--accent-color);
    border-radius: 50%;
    vertical-align: middle;
    margin-right: 8px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Local Tab Styles */
.local-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.local-actions-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
}

.card-icon {
    font-size: 32px;
    background: var(--bg-secondary);
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
}

.card-content h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: var(--text-primary);
}

.card-content p {
    margin: 0 0 16px 0;
    color: var(--text-secondary);
    font-size: 13px;
}

.action-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
}

.action-btn:hover {
    background: var(--bg-hover);
    border-color: var(--text-muted);
}

.action-btn.primary {
    background: var(--accent-color);
    color: white;
    border: none;
}

.action-btn.primary:hover {
    opacity: 0.9;
}

.dev-tip {
    margin-top: 16px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
}
</style>
