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

        <!-- Custom Apps Drop Zone -->
        <div class="custom-apps-section">
            <label class="section-label">{{ t('settings.search.localApp.label') }}</label>
            <div class="drop-zone">
                <span>{{ t('settings.search.localApp.dropZone') }}</span>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import type { Settings } from '@shared/types/settings';
import { useI18n } from '../../composables/useI18n';

const settings = inject<Settings>('settings')!;
const { t } = useI18n();

defineEmits(['open-plugin-manager']);
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

/* Custom Apps Zone */
.custom-apps-section {
    margin-top: 24px;
}
.section-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 12px;
}
.drop-zone {
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}
.drop-zone:hover {
    border-color: #f43f5e;
    color: #f43f5e;
    background: var(--bg-selected);
}
</style>
