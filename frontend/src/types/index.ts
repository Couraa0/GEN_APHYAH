// Bentuk data dari API. Nilai Decimal (berat, harga) dikirim server sebagai string.
export type Num = string | number

export type Role = 'ADMIN' | 'PENGURUS' | 'PETUGAS' | 'MITRA'

export interface User {
  id: string
  name: string
  username: string
  role: Role
  buyerId: string | null
  active?: boolean
}

export interface Named {
  id: string
  name: string
  active?: boolean
}

export interface Household extends Named {
  address: string | null
  rt: string | null
  rw: string | null
  phone: string | null
  _count?: { collections: number }
}

export interface CollectionPoint extends Named {
  description: string | null
}

export interface Category extends Named {
  group: 'ANORGANIK' | 'ORGANIK' | 'RESIDU'
  listed: boolean
  pricePerKg: Num | null
  stockKg?: Num
}

export interface Buyer extends Named {
  phone: string | null
  address: string | null
  notes: string | null
}

export interface Collection {
  id: string
  weightKg: Num
  collectionType: string
  recordedAt: string
  collectionPoint: { name: string }
  wasteCategory: { name: string }
  household: { name: string } | null
  recordedBy: { name: string }
  weighing: { deviceId: string } | null
}

export interface Weighing {
  id: string
  deviceId: string
  weightKg: Num
  measuredAt: string
}

export interface Movement {
  id: string
  type: string
  quantityKg: Num
  note: string | null
  createdAt: string
  wasteCategory: { name: string }
  recordedBy: { name: string }
}

export interface Pickup {
  id: string
  scheduledAt: string
  status: string
  movedWeightKg: Num | null
  handedOverTo: string | null
  notes: string | null
  collectionPoint: { name: string }
  assignedTo: { name: string } | null
}

export interface MarketRequest {
  id: string
  quantityKg: Num
  offeredPricePerKg: Num | null
  status: string
  note: string | null
  createdAt: string
  buyer: { name: string }
  wasteCategory: { name: string }
  sale: { id: string; weightKg: Num; totalAmount: Num } | null
}

export interface Sale {
  id: string
  weightKg: Num
  pricePerKg: Num
  totalAmount: Num
  soldAt: string
  buyer: { name: string }
  wasteCategory: { name: string }
}

export interface OrganicRecord {
  id: string
  type: 'FEEDING' | 'OBSERVATION' | 'HARVEST' | 'FRASS'
  weightKg: Num | null
  note: string | null
  recordedAt: string
}

export interface OrganicBatch {
  id: string
  code: string
  startedAt: string
  status: 'ACTIVE' | 'CLOSED'
  notes: string | null
  records: OrganicRecord[]
}

export interface PlasticExperiment {
  id: string
  code: string
  plasticWeightKg: Num
  composition: string | null
  method: string | null
  partner: string | null
  prototypeCount: number
  testResult: string | null
  evaluation: string | null
  conductedAt: string
  wasteCategory: { name: string }
}

export interface Report {
  collected: {
    totalKg: Num
    count: number
    byCategory: { id: string; name: string; group?: string; weightKg: Num }[]
    byPoint: { id: string; name: string; weightKg: Num; count: number }[]
  }
  moved: { totalKg: Num; count: number }
  sold: { totalKg: Num; totalAmount: Num; count: number }
  organic: { feedingKg: Num; harvestKg: Num; frassKg: Num }
  plastic: { processedKg: Num; experiments: number; prototypes: number }
}

export interface Dashboard extends Report {
  stock: Category[]
  upcomingPickups: Pickup[]
  pending: { weighings: number; requests: number }
  trend: { day: string; weightKg: number }[]
}
