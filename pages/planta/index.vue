<script setup>
import Slider from '@vueform/slider';
import '@vueform/slider/themes/default.css';
// https://github.com/vueform/slider

const runtimeConfig = useRuntimeConfig();
const enteredPassword = useCookie('enteredPassword', { maxAge: 60604800 });
const client = useSupabaseClient();

const route = useRoute();
const router = useRouter();

console.log(route.query.test);

const searchQuery = ref(route.query.sök || '');

// Watch for changes in the searchQuery
watch(searchQuery, (newQuery) => {
  // Update the URL when the searchQuery changes
  router.replace(
    {
      query: { ...route.query, sök: newQuery || undefined },
    },
    { replace: true }
  );
});

// Watch for changes in the route query
watch(
  () => route.query.sök,
  (newSearch) => {
    // Update the searchQuery when the URL changes
    if (newSearch !== searchQuery.value) {
      searchQuery.value = newSearch || '';
    }
  }
);

const defaultSlider = {
  höjd: {
    min: 0,
    max: 50,
    step: 2,
  },
  bredd: {
    min: 0,
    max: 20,
    step: 1,
  },
  zon: {
    min: 0,
    max: 8,
    step: 1,
  },
};

const höjd = ref([defaultSlider.höjd.min, defaultSlider.höjd.max]);
const bredd = ref([defaultSlider.bredd.min, defaultSlider.bredd.max]);
const zon = ref(defaultSlider.zon.min);
// const zon = ref([defaultSlider.zon.min, defaultSlider.zon.max]);

const zonFormat = (zon) => {
  return zon === 8
    ? 'VIII'
    : zon === 7
    ? 'VII'
    : zon === 6
    ? 'VI'
    : zon === 5
    ? 'V'
    : zon === 4
    ? 'IV'
    : zon === 3
    ? 'III'
    : zon === 2
    ? 'II'
    : zon === 1
    ? 'I'
    : '0';
};
const numberFormat = (zon) => {
  return zon === 'VIII'
    ? 8
    : zon === 'VII'
    ? 7
    : zon === 'VI'
    ? 6
    : zon === 'V'
    ? 5
    : zon === 'IV'
    ? 4
    : zon === 'III'
    ? 3
    : zon === 'II'
    ? 2
    : zon === 'I'
    ? 1
    : 0;
};

const { data: allaVäxter } = await useAsyncData('all-plants-fetch', async () => {
  const { data, error } = await client.from('lignosdatabasen').select().neq('art', 'slakte');
  if (error) {
    console.error(error);
  }
  if (runtimeConfig.public.ADMIN_PASSWORD === enteredPassword.value) {
    return data;
  } else {
    return data.filter((e) => e.hidden !== true);
  }
});
console.log(allaVäxter);

const computedList = computed(() => {
  let newList = allaVäxter.value;

  let queryArray = searchQuery.value.toLowerCase().split(' ');
  if (searchQuery.value) {
    // newList = newList.filter(e => e.text.toLowerCase().contains(searchQuery.value.toLowerCase()))
    newList = newList.filter((item) =>
      queryArray.every((str) =>
        `${item.slakte} ${item.art} ${item.sortnamn}`.toLowerCase().includes(str)
      )
    );
  }

  // --------- Höjd ---------
  if (höjd.value[0] !== defaultSlider.höjd.min || höjd.value[1] !== defaultSlider.höjd.max) {
    newList = newList.filter((obj) => {
      if (!obj.höjd) return false;
      const [lower, upper] = obj.höjd.split('-').map(Number);
      const [filterLower, filterUpper] = höjd.value;
      return (
        (lower >= filterLower && lower <= filterUpper) || // Lower bound of object is within filter range
        (upper >= filterLower && upper <= filterUpper) || // Upper bound of object is within filter range
        (filterLower >= lower && filterLower <= upper) // Filter range overlaps object range
      );
    });
  }
  // --------- Bredd ---------
  if (bredd.value[0] !== defaultSlider.bredd.min || bredd.value[1] !== defaultSlider.bredd.max) {
    newList = newList.filter((obj) => {
      if (!obj.bredd) return false;
      const [lower, upper] = obj.bredd.split('-').map(Number);
      const [filterLower, filterUpper] = bredd.value;
      return (
        (lower >= filterLower && lower <= filterUpper) || // Lower bound of object is within filter range
        (upper >= filterLower && upper <= filterUpper) || // Upper bound of object is within filter range
        (filterLower >= lower && filterLower <= upper) // Filter range overlaps object range
      );
    });
  }
  // --------- zon --------------
  if (zon.value !== defaultSlider.zon.min) {
    newList = newList.filter((obj) => {
      if (!obj.zon) return false;
      numberFormat(obj.zon);
      return (
        numberFormat(obj.zon) >= zon.value
        // (lower >= zon.value && lower <= zon.value) || // Lower bound of object is within filter range
        // (upper >= zon.value && upper <= zon.value) || // Upper bound of object is within filter range
        // (zon.value >= lower && zon.value <= upper) // Filter range overlaps object range
      );
    });
  }

  newList = newList.filter((e) => e.text !== 'Ingen info');
  newList = newList.filter((e) => e.text !== '');

  newList = newList.filter((e) => !e.art.includes('synonym'));

  newList = newList.sort((a, b) => a.sortnamn.localeCompare(b.sortnamn));
  newList = newList.sort((a, b) => a.art.localeCompare(b.art));
  newList = newList.sort((a, b) => a.slakte.localeCompare(b.slakte));

  return newList;
});

useSeoMeta({
  title: 'Översikt av alla växter - Lignosdatabasen',
  description:
    'Översikt av alla växter som finns på Lignosdatabasen. Här kan du läsa om vedartade växter, dvs. träd, buskar och klätterväxter.Urvalet siktar på allt som är som är härdigt att odla utomhus i Sverige.',
});
</script>

<template>
  <div class="page alla-växter-page">
    <div class="top-part">
      <h1>Alla växter</h1>
      <div class="filters">
        <div class="filter">
          <h2>Höjd: {{ höjd[0] }} - {{ höjd[1] }} meter</h2>
          <Slider
            v-model="höjd"
            :min="defaultSlider.höjd.min"
            :max="defaultSlider.höjd.max"
            :step="defaultSlider.höjd.step"
            tooltipPosition="bottom"
            showTooltip="drag"
          />
        </div>
        <div class="filter">
          <h2>Bredd: {{ bredd[0] }} - {{ bredd[1] }} meter</h2>
          <Slider
            v-model="bredd"
            :min="defaultSlider.bredd.min"
            :max="defaultSlider.bredd.max"
            :step="defaultSlider.bredd.step"
            tooltipPosition="bottom"
            showTooltip="drag"
          />
        </div>
        <div class="filter">
          <h2>
            Zon: <span class="zon">{{ zonFormat(zon) }}</span>
          </h2>
          <!-- <h2>Zon: {{ zon[0] }} - {{ zon[1] }}</h2> -->
          <Slider
            v-model="zon"
            :min="defaultSlider.zon.min"
            :max="defaultSlider.zon.max"
            :step="defaultSlider.zon.step"
            tooltipPosition="bottom"
            showTooltip="drag"
            :format="zonFormat"
          />
        </div>
        <input class="search" type="text" placeholder="Sök" v-model="searchQuery" />
      </div>
    </div>
    <div class="grid-layout">
      <Card v-for="växt in computedList" :key="växt.id" :växt="växt" />
    </div>
  </div>
</template>

<style>
.page.alla-växter-page {
  padding: 0 1rem;
}

.alla-växter-page .grid-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  /* padding: 0 1rem; */
  position: relative;
}

.alla-växter-page .grid-layout,
.alla-växter-page .top-part {
  max-width: 80rem;
  margin: 1rem auto 0;
}

@media screen and (min-width: 500px) {
  .alla-växter-page .grid-layout {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media screen and (min-width: 1000px) {
  .alla-växter-page .grid-layout {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2rem;
  }

  .alla-växter-page .top-part h1 {
    font-size: 2.5rem;
  }
}

.alla-växter-page .top-part {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
}

@media screen and (min-width: 1000px) {
  .alla-växter-page .top-part {
    gap: 5rem;
  }

  .alla-växter-page .top-part h1 {
    font-size: 2.5rem;
  }
}

@media screen and (max-width: 1000px) {
  .alla-växter-page .top-part {
    gap: 1rem;
  }
}

@media screen and (max-width: 1000px) {
  .alla-växter-page .top-part {
    margin-left: 1rem;
    margin-right: 1rem;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .dark .alla-växter-page .top-part {
    margin-left: 0;
    margin-right: 0;
  }
}

.alla-växter-page .top-part h1 {
  font-size: 2rem;
  line-height: 1;
  min-width: 9ch;
}

.top-part .filters {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 3rem;
  place-items: end center;
  /* width: 100%; */
  flex-grow: 1;
}

@media screen and (max-width: 1000px) {
  .top-part .filters {
    grid-template-columns: 1fr 1fr;
    place-items: center;
    width: 100%;
    gap: 1rem 3rem;
    margin-top: 1rem;
  }

  .top-part .filters .search {
    border-radius: 100rem;
    padding-left: 1rem;
    width: 100%;
  }
}

@media screen and (max-width: 500px) {
  .top-part .filters {
    gap: 1.5rem;
    place-items: center;
    grid-template-columns: 1fr;
  }
}

.filters * {
  transition: none;
}

.top-part .filters .slider-target {
  width: 100%;
  margin-bottom: 0.25rem;
}

.top-part .filter {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2px;
  /* grid-template-rows: 1fr 1fr;
  place-items: center; */
  height: 100%;
  width: 100%;
  gap: 0.5rem;
}

.top-part .filter * {
  font-family: var(--title-font);
}

.filter .zon {
  font-family: var(--slab-font);
}

html {
  --slider-connect-bg: var(--primary-green);
  --slider-tooltip-bg: var(--primary-green);
  --slider-handle-ring-color: #76994e30;
  --slider-bg: var(--element-bg);
  --slider-handle-bg: var(--title-color-dark);
  --slider-tooltip-color: var(--title-color-dark);

  --slider-connect-bg-disabled: #9ca3af;
  --slider-height: 6px;
  --slider-vertical-height: 300px;
  --slider-radius: 9999px;

  --slider-handle-border: 0;
  --slider-handle-width: 16px;
  --slider-handle-height: 16px;
  --slider-handle-radius: 9999px;
  --slider-handle-shadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.22);
  --slider-handle-shadow-active: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.42);
  --slider-handle-ring-width: 3px;

  --slider-tooltip-font-size: 0.875rem;
  --slider-tooltip-line-height: 1.25rem;
  --slider-tooltip-font-weight: 600;
  --slider-tooltip-min-width: 20px;
  --slider-tooltip-bg-disabled: #9ca3af;
  --slider-tooltip-radius: 8px;
  --slider-tooltip-py: 2px;
  --slider-tooltip-px: 6px;
  --slider-tooltip-arrow-size: 8px;
  --slider-tooltip-distance: 3px;
}

html.dark {
  --slider-handle-bg: var(--text-color-dark);
  --slider-tooltip-bg: var(--element-bg);
  --slider-tooltip-color: var(--text-color-dark);
}
</style>
