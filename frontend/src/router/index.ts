import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'chat', component: ChatView },
    {
      path: '/psy',
      name: 'operator',
      component: () => import('../views/OperatorView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
