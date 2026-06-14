export interface WaveformData {
  time: number[]
  bhz: number[]
  bhn: number[]
  bhe: number[]
  samplingRate: number
}

export interface PhasePick {
  id: string
  type: 'P' | 'S'
  time: number
  confidence: number
  method: string
}

export interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  elevation: number
}

export interface SeismicEvent {
  id: string
  magnitude: number
  depth: number
  originTime: string
  location: string
}

export interface UploadHistorySummary {
  id: string
  filename: string
  upload_time: string
  pick_count: number
}

export interface UploadHistoryDetail {
  id: string
  filename: string
  upload_time: string
  waveform: WaveformData
  picks: PhasePick[]
}
