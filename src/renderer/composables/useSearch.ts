import { ref } from 'vue';
import type { SearchResult } from '@shared/types/plugin';
import { IPC_CHANNELS } from '@shared/constants';

export function useSearch() {
    const searchResults = ref<SearchResult[]>([]);
    const selectedIndex = ref(0);
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;

    let latestQuery = '';

    async function search(query: string) {
        latestQuery = query;

        // 清除之前的定时器
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        selectedIndex.value = 0;

        if (!query || query.trim() === '') {
            searchResults.value = [];
            return;
        }

        // 防抖 300ms
        searchTimeout = setTimeout(async () => {
            try {
                // 如果查询已经改变（例如被清空了），则不执行搜索
                if (query !== latestQuery) return;

                const results = await window.electron.invoke(IPC_CHANNELS.SEARCH_QUERY, query);

                // 再次检查查询是否改变（因为搜索是异步的）
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
        if (!result) return;

        try {
            await window.electron.invoke('action:execute', result.action, result.data);
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
