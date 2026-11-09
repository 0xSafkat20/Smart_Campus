export type HoldStatus = 'HELD' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED'

export type ClassSummary = {
  id: string
  name: string
  totalSeats: number
  heldSeats: number
  confirmedSeats: number
  availableSeats: number
}

export type CreateClassInput = {
  name: string
  totalSeats: number
}

export type CreateClassResponse = {
  id: string
  name: string
  totalSeats: number
}

export type CreateHoldResponse = {
  holdId: string
  classId: string
  studentId: string
  status: 'HELD'
  expiresAt: string
}

export type HoldResponse = {
  holdId: string
  classId: string
  status: HoldStatus
  expiresAt: string
}

export type ConfirmHoldResponse = {
  holdId: string
  status: 'CONFIRMED'
}

export type MyHoldResponse = HoldResponse & {
  className: string
}
