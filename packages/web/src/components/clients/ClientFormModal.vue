<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import type { IClient } from '@gm-boutique/shared';
import { createClient, updateClient } from '../../api/clients';
import { useNotificationsStore } from '../../stores/notifications';
import Modal from '../ui/Modal.vue';

const props = defineProps<{ open: boolean; client?: IClient | null }>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved', client: IClient): void;
}>();

const notify = useNotificationsStore();
const loading = ref(false);

const isEdit = computed(() => !!props.client?._id);

const schema = yup.object({
  firstName: yup.string().trim().required('Le prénom est requis'),
  lastName: yup.string().trim().required('Le nom est requis'),
  phone: yup.string().trim().required('Le téléphone est requis'),
  email: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email invalide')
    .optional(),
  address: yup.string().optional(),
});

const { handleSubmit, errors, resetForm, meta } = useForm({ validationSchema: schema });

const { value: firstName } = useField<string>('firstName');
const { value: lastName } = useField<string>('lastName');
const { value: phone } = useField<string>('phone');
const { value: email } = useField<string>('email');
const { value: address } = useField<string>('address');

// (Ré)initialise le formulaire à chaque ouverture.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    resetForm({
      values: {
        firstName: props.client?.firstName ?? '',
        lastName: props.client?.lastName ?? '',
        phone: props.client?.phone ?? '',
        email: props.client?.email ?? '',
        address: props.client?.address ?? '',
      },
    });
  },
  { immediate: true }
);

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  try {
    const dto = {
      firstName: values.firstName!.trim(),
      lastName: values.lastName!.trim(),
      phone: values.phone!.trim(),
      email: values.email ? values.email.trim() : undefined,
      address: values.address ? values.address.trim() : undefined,
    };

    const saved = isEdit.value
      ? await updateClient(props.client!._id, dto)
      : await createClient({ ...dto, cguAccepted: props.client?.cguAccepted ?? false });

    notify.success(isEdit.value ? 'Cliente mise à jour.' : 'Cliente créée avec succès.');
    emit('saved', saved);
    emit('update:open', false);
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 400 && /phone/i.test(error.response?.data?.message ?? '')) {
      notify.error('Une cliente avec ce numéro de téléphone existe déjà.');
    } else {
      notify.error("Erreur lors de l'enregistrement de la cliente.");
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Modal :open="open" :title="isEdit ? 'Modifier la cliente' : 'Nouvelle cliente'" @update:open="emit('update:open', $event)">
    <form id="client-form" class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prénom</label>
          <input
            v-model="firstName"
            type="text"
            class="h-10 px-3 bg-card border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-foreground/20 transition"
            :class="errors.firstName ? 'border-red-400' : 'border-border'"
            placeholder="Marie"
          />
          <p v-if="errors.firstName" class="text-[12px] text-red-600">{{ errors.firstName }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nom</label>
          <input
            v-model="lastName"
            type="text"
            class="h-10 px-3 bg-card border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-foreground/20 transition"
            :class="errors.lastName ? 'border-red-400' : 'border-border'"
            placeholder="Dubois"
          />
          <p v-if="errors.lastName" class="text-[12px] text-red-600">{{ errors.lastName }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Téléphone</label>
          <input
            v-model="phone"
            type="tel"
            class="h-10 px-3 bg-card border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-foreground/20 transition"
            :class="errors.phone ? 'border-red-400' : 'border-border'"
            placeholder="079 123 45 67"
          />
          <p v-if="errors.phone" class="text-[12px] text-red-600">{{ errors.phone }}</p>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email <span class="text-muted-foreground/50 normal-case">(optionnel)</span></label>
          <input
            v-model="email"
            type="email"
            class="h-10 px-3 bg-card border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-foreground/20 transition"
            :class="errors.email ? 'border-red-400' : 'border-border'"
            placeholder="marie@exemple.ch"
          />
          <p v-if="errors.email" class="text-[12px] text-red-600">{{ errors.email }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Adresse <span class="text-muted-foreground/50 normal-case">(optionnel)</span></label>
        <input
          v-model="address"
          type="text"
          class="h-10 px-3 bg-card border border-border rounded-lg text-[13px] outline-none focus:ring-1 focus:ring-foreground/20 transition"
          placeholder="Rue du Commerce 1, 1000 Lausanne"
        />
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="h-10 px-4 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-black/5 transition-colors"
        @click="emit('update:open', false)"
      >
        Annuler
      </button>
      <button
        type="submit"
        form="client-form"
        :disabled="loading || !meta.valid"
        class="h-10 px-5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la cliente' }}
      </button>
    </template>
  </Modal>
</template>
