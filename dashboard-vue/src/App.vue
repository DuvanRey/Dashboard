<template>
  <div id="app">
    <h1>Dashboard Jornadas Educativas</h1>

    <div class="filters">
      <label>
        Municipio:
        <select v-model="selectedMunicipio">
          <option value="">Todos</option>
          <option v-for="mun in uniqueMunicipios" :key="mun" :value="mun">{{ mun }}</option>
        </select>
      </label>

      <label>
        <input type="checkbox" v-model="showManana" /> MAÑANA
      </label>
      <label>
        <input type="checkbox" v-model="showTarde" /> Tarde
      </label>
      <label>
        <input type="checkbox" v-model="showNocturna" /> Nocturna
      </label>
    </div>

    <div class="charts">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <table>
      <thead>
        <tr>
          <th>Municipio</th>
          <th>Sede</th>
          <th v-if="showManana">MAÑANA</th>
          <th v-if="showTarde">Tarde</th>
          <th v-if="showNocturna">Nocturna</th>
          <th>Total Matrícula</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filteredData" :key="row.dane_sede">
          <td>{{ row.municipi }}</td>
          <td>{{ row.sede }}</td>
          <td v-if="showManana">{{ row.MAÑANA }}</td>
          <td v-if="showTarde">{{ row.Tarde }}</td>
          <td v-if="showNocturna">{{ row.Nocturna }}</td>
          <td>{{ row['Total matricula'] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import * as XLSX from 'xlsx'
import Chart from 'chart.js/auto'

interface Row {
  ano: number
  nombsect: string
  codi_dan: string
  dane_act: string
  dane_sede: string
  municipi: string
  sede: string
  MAÑANA: number
  Tarde: number
  Nocturna: number
  'Fin de semana': number
  unica: number
  'Total matricula': number
  '% jornada Unica': string
}

const data = ref<Row[]>([])
const selectedMunicipio = ref('')
const showManana = ref(true)
const showTarde = ref(true)
const showNocturna = ref(true)
const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const uniqueMunicipios = computed(() => {
  const set = new Set(data.value.map(row => row.municipi))
  return Array.from(set).sort()
})

const filteredData = computed(() => {
  return data.value.filter(row => {
    if (selectedMunicipio.value && row.municipi !== selectedMunicipio.value) return false
    return true
  })
})

const updateChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  if (chart) chart.destroy()

  const municipios = uniqueMunicipios.value
  const totals = municipios.map(mun => {
    return filteredData.value
      .filter(row => row.municipi === mun)
      .reduce((sum, row) => {
        let total = 0
        if (showManana.value) total += row.MAÑANA
        if (showTarde.value) total += row.Tarde
        if (showNocturna.value) total += row.Nocturna
        return sum + total
      }, 0)
  })

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: municipios,
      datasets: [{
        label: 'Total Matrículas',
        data: totals,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

onMounted(async () => {
  try {
    const response = await fetch('/data.xlsx')
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json<Row>(worksheet)
    data.value = json
    updateChart()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

watch([selectedMunicipio, showManana, showTarde, showNocturna], updateChart)
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.filters {
  margin-bottom: 20px;
}

.filters label {
  margin: 0 10px;
}

.charts {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>