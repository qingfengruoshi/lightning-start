<template>
  <div class="settings-panel">
    
    <!-- Search Section -->
    <div class="section-group">
        <div class="section-title">{{ t('settings.search.title') }}</div>
        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.search.maxResults.label') }}</label>
            </div>
            <div class="control">
                <input type="number" v-model="settings.maxResults" min="1" max="20" class="number-input">
            </div>
        </div>

        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.search.searchMode.label') }}</label>
            </div>
            <div class="control">
                <select v-model="settings.searchMode" class="select-input">
                    <option value="fuzzy">{{ t('settings.search.searchMode.options.fuzzy') }}</option>
                    <option value="exact">{{ t('settings.search.searchMode.options.exact') }}</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Plugins Section -->
    <div class="section-group mt-8">
        <div class="section-title">{{ t('settings.search.plugins.title') }}</div>
        
        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.search.plugins.manage.label') }}</label>
            </div>
            <div class="control">
                <button class="secondary-btn" @click="$emit('open-plugin-manager')">{{ t('settings.search.plugins.manage.btn') }}</button>
            </div>
        </div>

        <!-- Rebuild Index -->
        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.search.index.label') || 'Rebuild Index' }}</label>
                <div class="setting-desc">{{ t('settings.search.index.desc') || 'Manually rebuild application index' }}</div>
            </div>
            <div class="control">
                <button class="secondary-btn" @click="rebuildIndex" :disabled="isRebuilding">
                    {{ isRebuilding ? 'Rebuilding...' : t('settings.search.index.btn') || 'Rebuild' }}
                </button>
            </div>
        </div>

        <!-- Custom Apps Paths -->
        <div 
            class="custom-apps-section"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent="onDragOver" 
            @dragleave.prevent="onDragLeave"
            @drop.prevent="handleDrop"
            :class="{ active: isDragging }"
        >
            <div class="section-header">
                <label class="section-label">{{ t('settings.search.localApp.label') }}</label>
                <button class="add-btn" @click="addCustomPath">
                    <span class="icon">+</span> {{ t('settings.search.localApp.add') }}
                </button>
            </div>
            
            <div class="drop-hint" v-if="isDragging">
                <span>{{ t('settings.search.localApp.dropZone') }}</span>
            </div>

            <div class="paths-list" v-if="settings.customPaths.length > 0">
                <div v-for="(path, index) in settings.customPaths" :key="index" class="path-item">
     <img 
        :src="pathIcons[path] || defaultIcon" 
        class="path-icon" 
        draggable="false"
        oncontextmenu="return false;"
     />
                     <span class="path-text" :title="path">{{ path }}</span>
                     <button class="remove-btn" @click="removePath(index)">×</button>
                </div>
            </div>
            <div class="empty-state" v-else>
                {{ t('settings.search.localApp.empty') }}
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, toRaw } from 'vue';
import type { Settings } from '@shared/types/settings';
import { useI18n } from '../../composables/useI18n';
import { IPC_CHANNELS } from '@shared/constants';

const settings = inject<Settings>('settings')!;
const { t } = useI18n();
const isRebuilding = ref(false);

defineEmits(['open-plugin-manager']);

onMounted(() => {
    loadIcons();
});




async function rebuildIndex() {
    isRebuilding.value = true;
    try {
        // Send raw paths to avoid proxy issues, though strings are primative, arrays might be proxied.
        const paths = toRaw(settings.customPaths);
        await window.electron.invoke(IPC_CHANNELS.INDEX_REBUILD, paths);
    } catch (e) {
        console.error('Failed to rebuild index:', e);
    } finally {
        isRebuilding.value = false;
    }
}

async function addCustomPath() {
    try {
        const path = await window.electron.invoke('dialog:open-directory');
        if (path && !settings.customPaths.includes(path)) {
            settings.customPaths.push(path);
            // Trigger icon load
            loadIcons();
            rebuildIndex();
        }
    } catch (e) {
        console.error('Failed to add custom path:', e);
    }
}

const isDragging = ref(false);
const pathIcons = ref<Record<string, string>>({});
const defaultIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIyIDE5YTIgMiAwIDAgMS0yIDJIMUMyYTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDRsMiAzaDhNMjIgMTlWNSIvPjwvc3ZnPg=='; // Folder icon

// Load icons for paths
async function loadIcons() {
    console.log('[Settings] Loading icons for paths:', settings.customPaths);
    for (const path of settings.customPaths) {
        // Always try to load if missing
        if (!pathIcons.value[path]) {
            try {
                const icon = await window.electron.invoke('get-file-icon', path);
                console.log(`[Settings] Icon for ${path}:`, icon ? 'Found' : 'Null');
                if (icon) pathIcons.value[path] = icon;
            } catch (e) {
                console.error(`[Settings] Failed to load icon for ${path}`, e);
            }
        }
    }
}





function onDragEnter(e: DragEvent) {
    // Only handle initial entry on the main container
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = true;
}

function onDragOver(e: DragEvent) {
    e.preventDefault(); 
    e.stopPropagation();
    isDragging.value = true;
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
    }
}

function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    isDragging.value = false;
}

function handleDrop(e: DragEvent) {
    isDragging.value = false;
    e.preventDefault(); 
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    
    if (files && files.length > 0) {
        let added = false;
        for (let i = 0; i < files.length; i++) {
            const path = files[i].path; 
            if (path && !settings.customPaths.includes(path)) {
                settings.customPaths.push(path);
                added = true;
            }
        }
        if (added) {
            loadIcons();
            rebuildIndex();
        }
    }
}

function removePath(index: number) {
    settings.customPaths.splice(index, 1);
    rebuildIndex();
}
</script>

<style scoped>
.settings-panel {
    max-width: 100%;
    margin: 0;
    font-family: inherit;
}

.section-group {
    margin-bottom: 32px;
}
.mt-8 {
    margin-top: 32px;
}

.section-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--text-primary);
    border-left: 4px solid #f43f5e;
    padding-left: 12px;
}

.setting-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
}

.setting-label-group {
    display: flex;
    flex-direction: column;
}

.setting-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
}

.control {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 200px;
    justify-content: flex-end;
}

.number-input {
    width: 60px;
    padding: 6px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    text-align: center;
    outline: none;
    background: var(--bg-primary);
    color: var(--text-primary);
}
.number-input:focus {
    border-color: var(--accent-color);
}

.select-input {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    font-size: 13px;
    color: var(--text-primary);
    min-width: 120px;
    outline: none;
}

.secondary-btn {
    padding: 6px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}
.secondary-btn:hover {
    background: var(--bg-hover);
    border-color: var(--text-muted);
}

.setting-desc {
    font-size: 12px;
    color: var(--text-muted);
}

/* Custom Apps Zone */
.custom-apps-section {
    margin-top: 24px;
    border: 2px dashed transparent;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s;
    position: relative;
}
.custom-apps-section.active {
    background: var(--bg-selected);
    border-color: var(--accent-color);
}

/* The overlay covers the entire section when active */
.drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10; /* Above everything else */
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--bg-selected-rgb), 0.5); /* Semi-transparent */
    border-radius: 12px;
}

.drop-hint {
    /* Center it in the overlay */
    pointer-events: none; /* Let clicks pass through if needed, though overlay catches drop */
    color: var(--accent-color);
    font-weight: 500;
    font-size: 14px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.section-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
}
.add-btn {
    padding: 6px 12px;
    background: transparent;
    border: 1px dashed var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}
.add-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
    background: var(--bg-hover);
}
.paths-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.path-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
}
.path-item:hover {
    border-color: var(--border-color);
}
.path-icon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    object-fit: contain;
}
.path-text {
    font-size: 13px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
}
.remove-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
}
.remove-btn:hover {
    color: #f43f5e;
}
.empty-state {
    padding: 32px;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border-radius: 8px;
    font-size: 13px;
    border: 1px dashed var(--border-color);
}
</style>
