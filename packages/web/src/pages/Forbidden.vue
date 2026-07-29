<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <h1 class="text-9xl font-black text-red-100">403</h1>
    <h2 class="text-2xl font-bold text-gray-800 mt-4 uppercase tracking-widest">Accès Interdit</h2>
    <p class="text-gray-500 mt-2 text-center max-w-md">Vous n'avez pas les permissions nécessaires pour consulter cette page.</p>
    
    <router-link to="/" class="mt-8 px-6 py-3 bg-black text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
      Retourner au tableau de bord
    </router-link>
  </div>
</template>
