import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { WaveformData, PhasePick, Station, SeismicEvent, UploadHistorySummary, UploadHistoryDetail } from '../types'

const LOCAL_HISTORY_KEY = 'seismic_upload_history'
const MAX_LOCAL_HISTORY = 20

export const useSeismicStore = defineStore('seismic', () => {
  const waveform = ref<WaveformData | null>(null)
  const picks = ref<PhasePick[]>([])
  const selectedStation = ref<Station | null>(null)
  const staWindow = ref(1.0)
  const ltaWindow = ref(10.0)
  const threshold = ref(3.5)
  const isLoading = ref(false)
  const uploadHistory = ref<UploadHistorySummary[]>([])
  const currentFilename = ref<string>('')

  const _localHistoryDetail = ref<Record<string, UploadHistoryDetail>>({})

  const events = ref<SeismicEvent[]>([
    { id: '1', magnitude: 4.2, depth: 12.5, originTime: '2025-01-15T08:23:41Z', location: '四川雅安' },
    { id: '2', magnitude: 3.8, depth: 8.3, originTime: '2025-01-14T14:12:05Z', location: '云南大理' },
    { id: '3', magnitude: 5.1, depth: 25.0, originTime: '2025-01-13T02:45:33Z', location: '台湾花莲' },
  ])

  const stations = ref<Station[]>([
    { id: 'STA01', name: 'BJI', latitude: 39.9, longitude: 116.4, elevation: 45 },
    { id: 'STA02', name: 'SSE', latitude: 31.2, longitude: 121.5, elevation: 10 },
    { id: 'STA03', name: 'KMI', latitude: 25.0, longitude: 102.7, elevation: 1890 },
    { id: 'STA04', name: 'HIA', latitude: 49.3, longitude: 119.7, elevation: 610 },
  ])

  _loadLocalStorage()

  function _saveLocalStorage() {
    try {
      const payload = {
        summary: uploadHistory.value,
        detail: _localHistoryDetail.value,
      }
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(payload))
    } catch {}
  }

  function _loadLocalStorage() {
    try {
      const raw = localStorage.getItem(LOCAL_HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.summary && Array.isArray(parsed.summary)) {
          uploadHistory.value = parsed.summary
        }
        if (parsed.detail && typeof parsed.detail === 'object') {
          _localHistoryDetail.value = parsed.detail
        }
      }
    } catch {}
  }

  function _addHistoryEntry(filename: string, wf: WaveformData, ps: PhasePick[]) {
    const id = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const uploadTime = new Date().toISOString()

    const summary: UploadHistorySummary = {
      id,
      filename,
      upload_time: uploadTime,
      pick_count: ps.length,
    }

    const detail: UploadHistoryDetail = {
      id,
      filename,
      upload_time: uploadTime,
      waveform: wf,
      picks: ps,
    }

    uploadHistory.value = [summary, ...uploadHistory.value].slice(0, MAX_LOCAL_HISTORY)
    _localHistoryDetail.value[id] = detail

    const allIds = uploadHistory.value.map(s => s.id)
    Object.keys(_localHistoryDetail.value).forEach(k => {
      if (!allIds.includes(k)) delete _localHistoryDetail.value[k]
    })

    _saveLocalStorage()
    return id
  }

  function generateMockWaveform(): WaveformData {
    const sr = 100  // sampling rate Hz
    const duration = 60  // seconds
    const n = sr * duration
    const time = Array.from({ length: n }, (_, i) => i / sr)
    const bhz: number[] = [], bhn: number[] = [], bhe: number[] = []

    for (let i = 0; i < n; i++) {
      const t = time[i]
      // Background noise
      let vz = (Math.random() - 0.5) * 0.02
      let ns = (Math.random() - 0.5) * 0.02
      let ew = (Math.random() - 0.5) * 0.02

      // P-wave arrival at t=10s
      if (t > 10 && t < 18) {
        const amp = 0.8 * Math.exp(-(t - 12) * (t - 12) / 8)
        vz += amp * Math.sin(2 * Math.PI * 8 * t)
        ns += amp * 0.3 * Math.sin(2 * Math.PI * 8 * t + 0.5)
        ew += amp * 0.3 * Math.sin(2 * Math.PI * 8 * t + 1.0)
      }

      // S-wave arrival at t=22s
      if (t > 22 && t < 40) {
        const amp = 1.5 * Math.exp(-(t - 28) * (t - 28) / 30)
        vz += amp * 0.4 * Math.sin(2 * Math.PI * 4 * t)
        ns += amp * Math.sin(2 * Math.PI * 4 * t + 0.3)
        ew += amp * Math.sin(2 * Math.PI * 4 * t + 0.8)
      }

      // Surface waves at t=35s
      if (t > 35 && t < 55) {
        const amp = 2.0 * Math.exp(-(t - 42) * (t - 42) / 50)
        vz += amp * Math.sin(2 * Math.PI * 1.5 * t)
        ns += amp * Math.sin(2 * Math.PI * 1.5 * t + 0.4)
        ew += amp * Math.sin(2 * Math.PI * 1.5 * t + 0.9)
      }

      bhz.push(vz)
      bhn.push(ns)
      bhe.push(ew)
    }

    return { time, bhz, bhn, bhe, samplingRate: sr }
  }

  function loadMockData() {
    waveform.value = generateMockWaveform()
    picks.value = [
      { id: 'p1', type: 'P', time: 10.2, confidence: 0.92, method: 'STA/LTA' },
      { id: 'p2', type: 'S', time: 22.5, confidence: 0.88, method: 'STA/LTA' },
    ]
    currentFilename.value = '模拟数据'
    _addHistoryEntry('模拟数据', waveform.value, picks.value)
  }

  function staLtaPicking(): PhasePick[] {
    if (!waveform.value) return []
    const data = waveform.value.bhz
    const sr = waveform.value.samplingRate
    const staLen = Math.floor(staWindow.value * sr)
    const ltaLen = Math.floor(ltaWindow.value * sr)
    const newPicks: PhasePick[] = []

    let lta = 0
    for (let i = ltaLen; i < data.length - staLen; i++) {
      let sta = 0
      for (let j = 0; j < staLen; j++) sta += data[i + j] * data[i + j]
      sta /= staLen

      lta = 0
      for (let j = 0; j < ltaLen; j++) lta += data[i - j] * data[i - j]
      lta /= ltaLen

      const ratio = lta > 0 ? sta / lta : 0
      if (ratio > threshold.value) {
        const t = waveform.value.time[i]
        const existsNear = newPicks.some(p => Math.abs(p.time - t) < 2)
        if (!existsNear) {
          newPicks.push({
            id: `pick_${Date.now()}_${i}`,
            type: newPicks.length === 0 ? 'P' : 'S',
            time: t,
            confidence: Math.min(1, ratio / 10),
            method: 'STA/LTA'
          })
        }
      }
    }
    return newPicks
  }

  async function uploadAndAnalyze(file: File) {
    isLoading.value = true
    currentFilename.value = file.name
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await fetch('/api/waveform/upload', { method: 'POST', body: formData })
      if (resp.ok) {
        const data = await resp.json()
        waveform.value = data.waveform
        picks.value = data.picks || []
        if (waveform.value) {
          _addHistoryEntry(file.name, waveform.value, picks.value)
        }
      } else {
        throw new Error('upload failed')
      }
    } catch {
      loadMockData()
    } finally {
      isLoading.value = false
    }
  }

  async function fetchHistory() {
    _loadLocalStorage()
    try {
      const resp = await fetch('/api/history')
      if (resp.ok) {
        const serverList: UploadHistorySummary[] = await resp.json()
        const existingIds = new Set(uploadHistory.value.map(s => s.id))
        for (const s of serverList) {
          if (!existingIds.has(s.id)) {
            uploadHistory.value.push(s)
          }
        }
        uploadHistory.value.sort((a, b) =>
          new Date(b.upload_time).getTime() - new Date(a.upload_time).getTime()
        )
        uploadHistory.value = uploadHistory.value.slice(0, MAX_LOCAL_HISTORY)
      }
    } catch {}
  }

  async function loadFromHistory(recordId: string) {
    isLoading.value = true
    try {
      const local = _localHistoryDetail.value[recordId]
      if (local) {
        waveform.value = local.waveform
        picks.value = local.picks
        currentFilename.value = local.filename
        isLoading.value = false
        return
      }
      const resp = await fetch(`/api/history/${recordId}`)
      if (resp.ok) {
        const data: UploadHistoryDetail = await resp.json()
        waveform.value = data.waveform
        picks.value = data.picks
        currentFilename.value = data.filename
      }
    } catch {} finally {
      isLoading.value = false
    }
  }

  return {
    waveform, picks, selectedStation, staWindow, ltaWindow, threshold,
    isLoading, events, stations, uploadHistory, currentFilename,
    loadMockData, staLtaPicking, uploadAndAnalyze, generateMockWaveform,
    fetchHistory, loadFromHistory
  }
})
