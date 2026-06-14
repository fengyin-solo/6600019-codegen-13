<template>
  <div class="flex flex-col gap-2">
    <div v-for="(comp, idx) in components" :key="comp.key" class="bg-gray-900 rounded-xl p-3">
      <h3 class="text-xs text-gray-400 mb-1">{{ comp.label }}</h3>
      <v-chart :option="getChartOption(comp.key, comp.color)" class="h-40" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useSeismicStore } from '../store/seismic'
import type { EChartsOption } from 'echarts'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, MarkLineComponent])

const store = useSeismicStore()

const components = [
  { key: 'bhz' as const, label: 'BHZ (垂直分量)', color: '#22d3ee' },
  { key: 'bhn' as const, label: 'BHN (南北分量)', color: '#a78bfa' },
  { key: 'bhe' as const, label: 'BHE (东西分量)', color: '#34d399' },
]

function getChartOption(key: 'bhz' | 'bhn' | 'bhe', color: string): EChartsOption {
  const wf = store.waveform!
  // Downsample for performance
  const step = 5
  const time = wf.time.filter((_, i) => i % step === 0)
  const data = wf[key].filter((_, i) => i % step === 0)

  const markLines = store.picks.map(p => ({
    xAxis: p.time,
    label: { formatter: p.type, color: p.type === 'P' ? '#ef4444' : '#3b82f6', fontSize: 14, fontWeight: 'bold' as const },
    lineStyle: { color: p.type === 'P' ? '#ef4444' : '#3b82f6', width: 2, type: 'dashed' as const }
  }))

  return {
    tooltip: { trigger: 'axis', formatter: (params: any) => `t=${params[0].value[0].toFixed(2)}s\namp=${params[0].value[1].toFixed(4)}` },
    grid: { left: 50, right: 20, top: 10, bottom: 25 },
    xAxis: { type: 'value', min: 0, max: time[time.length - 1], axisLabel: { color: '#666', formatter: '{value}s' } },
    yAxis: { type: 'value', axisLabel: { color: '#666' }, splitLine: { lineStyle: { color: '#1f2937' } } },
    series: [{
      type: 'line',
      showSymbol: false,
      lineStyle: { color, width: 1 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '33' }, { offset: 1, color: 'transparent' }] } },
      data: time.map((t, i) => [t, data[i]]),
      markLine: { symbol: 'none', data: markLines }
    }]
  }
}
</script>
