<script setup lang="ts">
/**
 * Shelf tile — cover-first grid cell for the backlog.
 *
 * Cover art is the content here, so the tile carries no card chrome: no
 * surface, no border, no elevation. Everything around the artwork stays quiet
 * (see Akoma content/patterns.md, "page tone").
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CoverImage from '@/components/media/CoverImage.vue'
import {
  STATUS_COLORS,
  statusLabel,
  TYPE_COLORS,
  itemCreator,
} from '@/types/media'
import type { BacklogItem } from '@/types/media'

const props = defineProps<{
  item: BacklogItem
  suppressClick?: boolean
}>()

const router = useRouter()

const typeColor = computed(() => TYPE_COLORS[props.item.type])
const statusColor = computed(() => STATUS_COLORS[props.item.status])
const meta = computed(() => itemCreator(props.item) ?? props.item.year)

/**
 * `want` is the baseline of a backlog — flagging it marks nearly every tile and
 * says nothing. The ribbon is reserved for states where something happened.
 */
const showFlag = computed(() => props.item.status !== 'want')

function open() {
  if (props.suppressClick) return
  void router.push(`/item/${props.item.id}`)
}
</script>

<template>
  <article class="tile">
    <button class="tile__hit" type="button" @click="open">
      <span class="tile__cover cover">
        <CoverImage
          :src="item.coverUrl"
          :alt="`Capa de ${item.title}`"
          :fallback-letter="item.title.charAt(0)"
          :accent="typeColor"
        />
        <span
          v-if="showFlag"
          class="tile__flag"
          :style="{ background: statusColor }"
          aria-hidden="true"
        />
      </span>

      <span class="tile__title">{{ item.title }}</span>

      <span class="tile__meta">
        <template v-if="item.userRating">
          <span class="tile__star" aria-hidden="true">★</span>
          <span class="numeric">{{ item.userRating }}</span>
        </template>
        <span v-else-if="meta" class="tile__meta-text">{{ meta }}</span>
      </span>

      <span class="sr-only">{{ statusLabel(item.status, item.type) }}</span>
    </button>
  </article>
</template>

<style scoped>
.tile__hit {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tile__hit:focus-visible {
  outline: none;
  border-radius: var(--radius-md);
  box-shadow: var(--focus-ring);
}

.tile__cover {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  transition: transform var(--transition);
}

.tile__hit:active .tile__cover {
  transform: scale(0.97);
}

/* Status ribbon, top-left — mirrors a physical bookmark tucked in the cover.
 * Cover art is unpredictable, so a drop-shadow (which follows the clip path,
 * unlike a border) keeps the ribbon legible on light and dark artwork alike. */
.tile__flag {
  position: absolute;
  top: 0;
  left: var(--space-2);
  width: 14px;
  height: 20px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
  filter:
    drop-shadow(0 0 1px var(--bg-elevated))
    drop-shadow(0 0 1px var(--bg-elevated))
    drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
}

.tile__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: var(--text-sm);
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.tile__meta {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
  margin-top: -2px;
  font-size: var(--text-2xs);
  color: var(--text-secondary);
}

.tile__star {
  color: var(--warning);
}

.tile__meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .tile__cover,
  .tile__hit:active .tile__cover {
    transition: none;
    transform: none;
  }
}
</style>
