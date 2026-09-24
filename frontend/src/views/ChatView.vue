<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useChatStore } from '../stores/chat';
import { useQuickExit } from '../composables/useQuickExit';
import { useAppViewport } from '../composables/useAppViewport';
import AmbientLight from '../components/AmbientLight.vue';
import ChatHeader from '../components/ChatHeader.vue';
import MessageBubble from '../components/MessageBubble.vue';
import ThreadDivider from '../components/ThreadDivider.vue';
import MessageComposer from '../components/MessageComposer.vue';
import TypingDots from '../components/TypingDots.vue';
import StarterChips from '../components/StarterChips.vue';
import SafetyStrip from '../components/SafetyStrip.vue';

const chat = useChatStore();
const { leave, wipeAndLeave } = useQuickExit();

const thread = ref<HTMLElement | null>(null);
const composer = ref<InstanceType<typeof MessageComposer> | null>(null);

// Клавиатура меняет видимую высоту — лента должна остаться у последнего
// сообщения, а не уехать в середину переписки.
const { keyboardOpen } = useAppViewport(() => scrollToEnd('auto'));

onMounted(async () => {
  await chat.start();
  // Фокус ставим только на десктопе: на телефоне он немедленно поднимет
  // клавиатуру и закроет приветствие, которое ребёнок ещё не прочитал.
  if (window.matchMedia('(pointer: fine)').matches) composer.value?.focus();
});

function scrollToEnd(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    const el = thread.value;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  });
}

watch(() => chat.messages.length, () => scrollToEnd());
watch(() => chat.psychologistTyping, () => scrollToEnd());
watch(() => chat.revealing, () => scrollToEnd('auto'));

async function purge() {
  await chat.purge();
  await chat.start();
}

/** Стереть разговор и сразу уйти со страницы — одним действием. */
async function purgeAndLeave() {
  await chat.purge();
  wipeAndLeave();
}
</script>

<template>
  <div class="screen app-frame">
    <AmbientLight />

    <ChatHeader :connection="chat.connection" @exit="leave" />

    <main ref="thread" class="thread scroll-area">
      <div class="thread__inner">
        <TypingDots v-if="chat.revealing" />

        <template v-for="message in chat.messages" :key="message.id">
          <ThreadDivider v-if="message.author === 'DIVIDER'" :label="message.body" />
          <MessageBubble v-else :message="message" />
        </template>

        <TypingDots v-if="chat.psychologistTyping && !chat.revealing" />

        <p v-if="chat.errorText" class="notice">{{ chat.errorText }}</p>
      </div>
    </main>

    <footer class="dock">
      <div class="dock__inner">
        <StarterChips
          v-if="!chat.hasChildMessage && !chat.revealing && !keyboardOpen"
          @pick="(text) => composer?.insert(text)"
        />

        <MessageComposer
          ref="composer"
          :disabled="chat.connection === 'offline'"
          @send="chat.send"
          @typing="chat.notifyTyping"
          @focus="scrollToEnd('auto')"
        />

        <SafetyStrip
          :compact="keyboardOpen"
          @purge="purge"
          @purge-and-leave="purgeAndLeave"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.screen {
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr auto;
  /* Вырез камеры и полоса жестов: контент не должен под них уезжать. */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.thread {
  min-height: 0;
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

@media (max-width: 34rem) {
  .thread {
    padding: var(--space-2) var(--space-3) var(--space-3);
  }

  .dock {
    padding: var(--space-1) var(--space-3) var(--space-3);
  }
}
</style>
