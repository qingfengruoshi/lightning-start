<template>
  <div class="settings-panel">
    
    <div class="about-section">
        <div class="app-logo">⚡</div>
        <h3>lightning-start</h3>
        <p class="version">{{ t('settings.about.version') }} 1.0.0</p>
        
        <div class="about-links">
            <div class="info-row">
                <span class="label">{{ t('settings.about.author') }}:</span>
                <span class="value">ShuoJing</span>
            </div>
             <div class="info-row">
                <span class="label">{{ t('settings.about.github') }}:</span>
                <span class="value link" @click="openGithub">{{ t('settings.about.visit') }}</span>
            </div>
             <div class="info-row">
                <span class="label">{{ t('settings.about.license') }}:</span>
                <span class="value">MIT</span>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../../composables/useI18n';

const { t } = useI18n();

function openGithub() {
    window.electron.openExternal('https://github.com/qingfengruoshi/lightning-start');
}
</script>

<style scoped>
.settings-panel {
    max-width: 100%;
    height: 100%;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
}

.about-section {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.app-logo {
    font-size: 64px;
    width: 100px;
    height: 100px;
    background: var(--bg-secondary);
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    border: 2px solid var(--border-color);
    box-shadow: var(--shadow);
    color: var(--accent-color);
}

h3 {
    margin: 0;
    font-size: 24px;
    color: var(--text-primary);
}

.version {
    margin: 0;
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 16px;
}

.secondary-btn {
    padding: 8px 20px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}
.secondary-btn:hover {
    background: var(--bg-hover);
    border-color: var(--text-muted);
    color: var(--text-primary);
}

.about-links {
    margin-top: 32px;
    text-align: left;
    width: 100%;
    max-width: 320px;
    background: var(--bg-secondary);
    padding: 16px;
    border-radius: 12px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 8px;
    align-items: center;
}
.info-row:last-child {
    margin-bottom: 0;
}
.info-row .label {
    color: var(--text-secondary);
}
.info-row .value {
    color: var(--text-primary);
    font-family: monospace;
}
.info-row .value.link {
    color: var(--accent-color);
    cursor: pointer;
}
.info-row .value.link:hover {
    text-decoration: underline;
}
</style>
