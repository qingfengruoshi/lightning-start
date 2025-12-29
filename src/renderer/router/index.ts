import { createRouter, createWebHashHistory } from 'vue-router';
import Search from '../views/Search.vue';
import Settings from '../views/Settings.vue';

const routes = [
    {
        path: '/',
        name: 'Search',
        component: Search,
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings,
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
