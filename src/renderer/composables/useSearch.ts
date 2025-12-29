import { ref, toRaw } from 'vue';
import type { SearchResult } from '@shared/types/plugin';
import { IPC_CHANNELS } from '@shared/constants';

export function useSearch() {
    const searchResults = ref<SearchResult[]>([]);
    const selectedIndex = ref(0);
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;
    let latestQuery = '';

    // ... (search function remains same)

    async function search(query: string) {
        // ... (implementation matches existing)
        latestQuery = query;
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        selectedIndex.value = 0;
        if (!query || query.trim() === '') {
            searchResults.value = [];
            return;
        }
        searchTimeout = setTimeout(async () => {
            try {
                if (query !== latestQuery) return;
                const results = await window.electron.invoke(IPC_CHANNELS.SEARCH_QUERY, query);
                if (query !== latestQuery) return;
                searchResults.value = results;
            } catch (error) {
                if (query !== latestQuery) return;
                console.error('Search error:', error);
                searchResults.value = [];
            }
        }, 300);
    }

    function selectNext() {
        if (selectedIndex.value < searchResults.value.length - 1) {
            selectedIndex.value++;
        }
    }

    function selectPrev() {
        if (selectedIndex.value > 0) {
            selectedIndex.value--;
        }
    }

    async function executeAction(index: number) {
        const result = searchResults.value[index];
        console.log('[useSearch] executeAction called for index:', index, 'result:', result);
        if (!result) {
            console.warn('[useSearch] No result found at index:', index);
            return;
        }

        try {
            // Strip reactivity to avoid DataCloneError
            const data = toRaw(result.data);
            await window.electron.invoke('action:execute', result.action, data);
        } catch (error) {
            console.error('Action execution error:', error);
        }
    }

    return {
        searchResults,
        selectedIndex,
        search,
        selectNext,
        selectPrev,
        executeAction,
    };
}
