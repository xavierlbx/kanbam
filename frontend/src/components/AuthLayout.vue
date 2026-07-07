<template>
  <div class="auth-layout">
    <div class="form-panel">
      <div class="form-container">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
}

.form-panel {
  flex: 1;
  flex-shrink: 0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2.5rem;
  background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%);
}

.form-container {
  width: 100%;
  max-width: 450px;
  background-color: white;
  padding: 2rem;
  border-radius: 2rem;
}
</style>
