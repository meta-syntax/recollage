<!-- ローディング表示（文言なし・ドットのみ）。3つの丸が順に明滅する波。
     色は currentColor 継承（置き場所の文字色に馴染む）。
     spa-loading-template.html にも同じ動きを複製している -->
<template>
  <span
    class="dots"
    role="status"
    aria-label="読み込み中"
  ><span class="d" /><span class="d" /><span class="d" /></span>
</template>

<style scoped>
.dots {
  display: inline-flex;
  gap: 10px;
}
.d {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: dot-breath 1.2s ease-in-out infinite;
}
.d:nth-child(2) { animation-delay: .2s; }
.d:nth-child(3) { animation-delay: .4s; }
@keyframes dot-breath {
  0%, 100% { opacity: .2; transform: scale(.8); }
  40% { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .d { animation: none; opacity: .6; }
}
</style>
