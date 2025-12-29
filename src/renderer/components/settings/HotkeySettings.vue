<template>
  <div class="settings-panel">
    <div class="section-title">{{ t('settings.hotkey.title') }}</div>
    
    <div class="settings-card">
        <!-- Activation Hotkey -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.hotkey.activation.label') }}</label>
                <div class="setting-desc">{{ t('settings.hotkey.activation.desc') }}</div>
            </div>
            <div class="control">
                <input 
                    type="text" 
                    v-model="hotkeyDisplay" 
                    @keydown.prevent="recordHotkey"
                    :placeholder="t('settings.hotkey.activation.placeholder')"
                    class="hotkey-input"
                    readonly
                >
            </div>
        </div>

        <!-- Other Shortcuts -->
        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.hotkey.other.label') }}</label>
            </div>
            <div class="control">
                <button class="secondary-btn">配置</button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, watch } from 'vue';
import type { Settings } from '@shared/types/settings';
import { useI18n } from '../../composables/useI18n';

const settings = inject<Settings>('settings')!;
const { t } = useI18n();

const hotkeyDisplay = ref(settings.hotkey);

// Sync initial value (case where settings is loaded async after mount)
watch(() => settings.hotkey, (newVal) => {
    if (newVal) hotkeyDisplay.value = newVal;
}, { immediate: true });

function recordHotkey(e: KeyboardEvent) {
    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.metaKey) keys.push('Super'); 
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');

    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

    let key = e.key.toUpperCase();
    const keyMap: Record<string, string> = { ' ': 'Space' };
    if (keyMap[e.key]) key = keyMap[e.key];

    keys.push(key);
    
    const hotkeyStr = keys.join('+');
    hotkeyDisplay.value = hotkeyStr;
    settings.hotkey = hotkeyStr;
    // updateSetting removed - Parent saves on button click
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

.settings-card {
    background: transparent;
    border: none;
    padding: 0;
}

.setting-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid var(--border-color);
}

.setting-group:first-child {
    padding-top: 0;
}

.setting-label-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.setting-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0.2px;
}

.setting-desc {
    font-size: 12px;
    color: var(--text-muted);
}

.control {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 200px;
    justify-content: flex-end;
}

/* Hotkey Button Style */
.hotkey-input {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    min-width: 100px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.hotkey-input:hover {
    border-color: var(--text-muted);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transform: translateY(-1px);
}

.hotkey-input:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
    outline: none;
}

.secondary-btn {
    padding: 6px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
}
.secondary-btn:hover {
    background: var(--bg-hover);
}
</style>
