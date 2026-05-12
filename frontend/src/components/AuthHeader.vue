<script setup lang="ts">
const props = defineProps({
  headerText: String,
})
</script>

<template>
  <div class="form-header">
    <div class="form-header-logo-container">
      <div class="brand-logo"><i class="pi pi-th-large" /></div>
      <h1 class="form-header-text">{{ props.headerText }}</h1>
    </div>
  </div>
</template>

<style scoped>
.form-header {
  flex: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
}

.form-header-logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  width: 47px;
  height: 47px;
  background: #8b5cf6;
  backdrop-filter: blur(6px);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo .pi {
  font-size: 1.55rem;
  color: #fff;
}

.form-header-text {
  font-size: 3rem;
  font-weight: 800;
  color: #8b5cf6;
  margin: 0 0 0.4rem;
  letter-spacing: +0.2px;
}
</style>
