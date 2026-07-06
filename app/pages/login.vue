<script setup lang="ts">
// ログイン（ADR-013）: email+password の一枚フォーム。
// サインアップ・パスワードリセットは作らない（ユーザーは dashboard で作成済み）。
import { getSupabaseClient } from '~/repositories/supabaseClient'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = null
  try {
    const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (signInError) {
      error.value = signInError.message
      return
    }
    await navigateTo('/')
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="paper">
    <form
      class="login"
      @submit.prevent="submit"
    >
      <div class="head">
        Recollage
      </div>
      <label class="field">
        <span class="label">メールアドレス</span>
        <input
          v-model="email"
          type="email"
          autocomplete="username"
          class="input"
        >
      </label>
      <label class="field">
        <span class="label">パスワード</span>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="input"
        >
      </label>
      <p
        v-if="error"
        class="error"
      >
        {{ error }}
      </p>
      <button
        type="submit"
        class="submit"
        :disabled="busy"
      >
        入る
      </button>
    </form>
  </div>
</template>

<style scoped>
.paper {
  max-width: 780px;
  margin: 0 auto;
  padding: 0 44px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  font-family: var(--font-serif);
}
.login {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 340px;
  gap: 16px;
}
.head {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: .18em;
  color: var(--accent);
  margin-bottom: 8px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .16em;
  color: var(--text-soft);
}
.input {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--line);
  padding: 10px 12px;
  outline: none;
}
.input:focus { border-color: var(--accent); }
.error {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--danger);
}
.submit {
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .14em;
  color: var(--text-inverse);
  background: var(--accent);
  border: 1px solid var(--accent);
  padding: 11px 26px;
  cursor: pointer;
  transition: background .2s ease;
}
.submit:hover:not(:disabled) { background: var(--accent-strong); }
.submit:disabled { opacity: .45; cursor: default; }
</style>
