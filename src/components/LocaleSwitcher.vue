<!--
========
Componente seletor de idioma (src/components/LocaleSwitcher.vue).
Renderiza o select reativo vinculado ao vue-i18n permitindo alternar em tempo real
entre Português (pt_br), Inglês (en) e quaisquer idiomas customizados adicionados pelo usuário.
========
-->
<script setup lang="ts">
import { computed } from 'vue';
import i18n, { definirIdioma } from '../i18n';

// Referência computada de leitura e escrita ligada ao locale global do vue-i18n
const idiomaSelecionado = computed<string>({
  get: () => String(i18n.global.locale.value),
  set: (novoIdioma: string) => {
    definirIdioma(novoIdioma);
  }
});

// Lista reativa de idiomas disponíveis registrados na instância do vue-i18n
const listaIdiomasDisponiveis = computed<string[]>(() =>
  i18n.global.availableLocales.map(String)
);
</script>

<template>
  <div class="locale-switcher fica-na-direita">
    <div class="locale-changer fica-na-direita">
      <select
        v-model="idiomaSelecionado"
        class="form-select vc-formato-select fica-na-direita"
        data-testid="select-locale-switcher"
        :aria-label="String(i18n.global.t('seletorIdioma.rotuloAria'))"
        :title="String(i18n.global.t('seletorIdioma.titulo'))"
      >
        <option
          v-for="locale in listaIdiomasDisponiveis"
          :key="`locale-${locale}`"
          :value="locale"
        >
          {{ locale }}
        </option>
      </select>
    </div>
  </div>
</template>
