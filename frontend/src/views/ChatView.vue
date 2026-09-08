<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useChatStore } from '../stores/chat';
import { useQuickExit } from '../composables/useQuickExit';
import AmbientLight from '../components/AmbientLight.vue';
import ChatHeader from '../components/ChatHeader.vue';
import MessageBubble from '../components/MessageBubble.vue';
import MessageComposer from '../components/MessageComposer.vue';
import TypingDots from '../components/TypingDots.vue';
import StarterChips from '../components/StarterChips.vue';
import SafetyStrip from '../components/SafetyStrip.vue';

const chat = useChatStore();
const { leave } = useQuickExit();

const thread = ref<HTMLElement | null>(null);
const composer = ref<InstanceType<typeof MessageComposer> | null>(null);

onMounted(async () => {
  await chat.start();
  composer.value?.focus();
});

function scrollToEnd() {
  nextTick(() => {
    const el = thread.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

watch(() => chat.messages.length, scrollToEnd);
watch(() => chat.psychologistTyping, scrollToEnd);
watch(() => chat.revealing, scrollToEnd);

async function purge() {
  await chat.purge();
  await chat.start();
}
</script>

<template>
  <div class="screen">
    <AmbientLight />

    <ChatHeader :connection="chat.connection" @exit="leave" />

    <main ref="thread" class="thread scroll-area">
      <div class="thread__inner">
        <TypingDots v-if="chat.revealing" />

        <MessageBubble v-for="message in chat.messages" :key="message.id" :message="message" />

        <TypingDots v-if="chat.psychologistTyping && !chat.revealing" />

        <p v-if="chat.errorText" class="notice">{{ chat.errorText }}</p>
      </div>
    </main>

    <footer class="dock">
      <div class="dock__inner">
        <StarterChips
          v-if="!chat.hasChildMessage && !chat.revealing"
          @pick="(text) => composer?.insert(text)"
        />

        <MessageComposer
          ref="composer"
          :disabled="chat.connection === 'offline'"
          @send="chat.send"
          @typing="chat.notifyTyping"
        />

        <SafetyStrip @purge="purge" />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.screen {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100dvh;
}

.thread {
  overflow-y: auto;
  padding: var(--space-4) var(--space-5) var(--space-5);
}

.thread__inner {
  width: min(100%, var(--thread-width));
  margin: 0 auto;
}

.dock {
  padding: var(--space-2) var(--space-5) var(--space-5);
  /* Мягкое растворение ленты под панелью ввода вместо жёсткой линии */
  background: linear-gradient(to bottom, rgba(237, 241, 242, 0) 0%, var(--mist) 22%);
}

.dock__inner {
  width: min(100%, var(--thread-width));
  margin: 0 auto;
}

.notice {
  margin: var(--space-4) 0;
  padding: var(--space-3) var(--space-4);
  background: var(--sand);
  border-radius: var(--radius-panel);
  color: var(--clay);
  font-size: var(--text-sm);
  text-align: center;
}

@media (max-width: 30rem) {
  .thread {
    padding: var(--space-2) var(--space-4) var(--space-4);
  }

  .dock {
    padding: var(--space-2) var(--space-4) var(--space-4);
  }
}
</style>
