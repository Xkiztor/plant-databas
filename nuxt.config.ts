// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  // modules: ['nuxt-icon'],
  modules: ['nuxt-icon', '@nuxtjs/supabase', '@nuxt/image', '@vueuse/nuxt'],
  supabase: {
    redirect: false,
  },
  runtimeConfig: {
    public: {
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    },
  },
});
