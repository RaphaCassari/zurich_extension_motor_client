<template>
    <v-app>
        <v-main>
            <router-view/>
      </v-main>
    </v-app>
</template>

<script>

export default {
    name: 'app'
};
</script>

<style>
html {
  overflow: hidden !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>