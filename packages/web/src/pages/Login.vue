<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';
import * as yup from 'yup';
import { useForm, useField } from 'vee-validate';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notify = useNotificationsStore();
const isLoading = ref(false);
const serverError = ref('');

// Schema de validation
const schema = yup.object({
  email: yup.string().email('Email invalide').required('L\'email est requis'),
  password: yup.string().required('Le mot de passe est requis'),
});

const { handleSubmit, errors, submitCount } = useForm({
  validationSchema: schema,
});

const { value: email } = useField('email');
const { value: password } = useField('password');

const onSubmit = handleSubmit(async (values) => {
  isLoading.value = true;
  serverError.value = '';

  try {
    await authStore.login(values.email as string, values.password as string);
    notify.success('Connexion réussie. Bienvenue !');
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    router.push(redirect);
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 401) {
      serverError.value = 'Email ou mot de passe incorrect.';
    } else if (status === 429) {
      serverError.value = 'Trop de tentatives. Réessaie dans quelques minutes.';
    } else {
      serverError.value = 'Une erreur est survenue lors de la connexion.';
    }
    notify.error(serverError.value);
  } finally {
    isLoading.value = false;
  }
});

// Animation Typographique de fond avec "Mouse Evasion"
const word = "GM BOUTIQUE".replace(/\s/g, "").split("");
const letters = ref<Array<{
  id: number;
  char: string;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  blur: number;
  targetEvadeX: number;
  targetEvadeY: number;
  currentEvadeX: number;
  currentEvadeY: number;
}>>([]);

let animationInterval: ReturnType<typeof setInterval>;
let animationFrameId: number;
const isMouseOverForm = ref(false);

const emailReadonly = ref(true);
const passwordReadonly = ref(true);

const handleMouseMove = (e: MouseEvent) => {
  const mX = e.clientX;
  const mY = e.clientY;
  
  letters.value.forEach(l => {
    if (isMouseOverForm.value) {
      l.targetEvadeX = 0;
      l.targetEvadeY = 0;
      return;
    }

    const lX = (l.baseX / 100) * window.innerWidth;
    const lY = (l.baseY / 100) * window.innerHeight;
    
    const dx = lX - mX;
    const dy = lY - mY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 250) {
      const force = (250 - dist) * 0.8;
      l.targetEvadeX = (dx / dist) * force;
      l.targetEvadeY = (dy / dist) * force;
    } else {
      l.targetEvadeX = 0;
      l.targetEvadeY = 0;
    }
  });
};

const animate = () => {
  letters.value.forEach(l => {
    // Déplacement fluide et continu
    l.baseX += l.vx;
    l.baseY += l.vy;

    // Si la lettre sort de l'écran, elle réapparait de l'autre côté
    if (l.baseX > 110) l.baseX = -10;
    if (l.baseX < -10) l.baseX = 110;
    if (l.baseY > 110) l.baseY = -10;
    if (l.baseY < -10) l.baseY = 110;

    // Interpolation mathématique pour l'évitement de la souris (rendu très doux)
    l.currentEvadeX += (l.targetEvadeX - l.currentEvadeX) * 0.1;
    l.currentEvadeY += (l.targetEvadeY - l.currentEvadeY) * 0.1;
  });
  animationFrameId = requestAnimationFrame(animate);
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);

  letters.value = Array.from({ length: 150 }, (_, i) => {
    const size = Math.random() * 4 + 1; 
    // Vitesse aléatoire directionnelle
    const speed = (Math.random() * 0.04) + 0.01;
    const angle = Math.random() * Math.PI * 2; // de 0 à 360 degrés
    return {
      id: i,
      char: word[Math.floor(Math.random() * word.length)],
      baseX: Math.random() * 120 - 10,
      baseY: Math.random() * 120 - 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: Math.random() * 0.1,
      size: size,
      blur: size > 3 ? 0 : (3 - size),
      targetEvadeX: 0, targetEvadeY: 0,
      currentEvadeX: 0, currentEvadeY: 0
    };
  });

  animate(); // Lancement de la boucle infinie de mouvement

  animationInterval = setInterval(() => {
    letters.value.forEach(l => {
      if (Math.random() > 0.6) {
        l.opacity = Math.random() * 0.6; 
      } else if (Math.random() > 0.5) {
        l.opacity = Math.random() * 0.1;
      }
    });
  }, 2000);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  clearInterval(animationInterval);
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 relative overflow-hidden">
    
    <!-- Animated Cinematic Typographic Background -->
    <div class="absolute inset-0 pointer-events-none z-0">
      <div 
        v-for="l in letters" 
        :key="l.id"
        class="font-black text-black absolute select-none pointer-events-none transition-opacity duration-[2000ms] ease-in-out"
        :style="{
          left: l.baseX + '%',
          top: l.baseY + '%',
          opacity: l.opacity,
          fontSize: l.size + 'rem',
          filter: `blur(${l.blur}px)`,
          transform: `translate(${l.currentEvadeX}px, ${l.currentEvadeY}px)`
        }"
      >
        {{ l.char }}
      </div>
    </div>

    <!-- Login Box (Solid White to blend flawlessly with the logo) -->
    <div 
      @mouseenter="isMouseOverForm = true"
      @mouseleave="isMouseOverForm = false"
      class="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-10 relative z-10 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
    >
      
      <div class="text-center mb-10">
        <!-- Logo officiel : se fond parfaitement dans le bg-white -->
        <div class="mx-auto w-40 h-40 mb-6 flex items-center justify-center relative">
          <img :src="'/logo.png'" alt="GM Boutique Logo" class="w-full h-full object-contain relative z-10" @error="$event.target.style.display='none'" />
        </div>
        
        <h2 class="text-xl font-bold text-black tracking-[0.2em] uppercase">Espace Gestion</h2>
      </div>

      <form @submit="onSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Adresse Email</label>
          <input 
            id="email" 
            type="email" 
            v-model="email" 
            autocomplete="username"
            :readonly="emailReadonly"
            @focus="emailReadonly = false"
            class="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 outline-none text-sm rounded-xl"
            :class="{'border-red-500/50 focus:ring-red-500': errors.email && submitCount > 0}"
            placeholder="exemple@gmail.com"
          />
          <p v-if="errors.email && submitCount > 0" class="text-red-500 text-xs mt-1.5 font-medium ml-1">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Mot de passe</label>
          <input 
            id="password" 
            type="password" 
            v-model="password" 
            autocomplete="current-password"
            :readonly="passwordReadonly"
            @focus="passwordReadonly = false"
            class="w-full px-4 py-3 bg-gray-50/50 border border-gray-200/50 focus:bg-white focus:ring-1 focus:ring-black focus:border-black transition-all placeholder-gray-400 outline-none text-sm rounded-xl"
            :class="{'border-red-500/50 focus:ring-red-500': errors.password && submitCount > 0}"
            placeholder="••••••••"
          />
          <p v-if="errors.password && submitCount > 0" class="text-red-500 text-xs mt-1.5 font-medium ml-1">{{ errors.password }}</p>
        </div>

        <div v-if="serverError" class="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-medium">
          {{ serverError }}
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full py-4 px-4 bg-black hover:bg-gray-900 text-white font-bold uppercase tracking-[0.15em] text-xs transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center mt-8 rounded-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
        >
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Authentification...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>
