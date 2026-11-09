import { apiRequest } from './client'
import type {
  ClassSummary,
  ConfirmHoldResponse,
  CreateClassInput,
  CreateClassResponse,
  CreateHoldResponse,
  HoldResponse,
  MyHoldResponse,
} from './types'

export function createSchoolAdmissionApi(studentId: string) {
  return {
    getClasses() {
      return apiRequest<ClassSummary[]>('/classes', studentId)
    },
    getClass(classId: string) {
      return apiRequest<ClassSummary>(`/classes/${classId}`, studentId)
    },
    createClass(input: CreateClassInput) {
      return apiRequest<CreateClassResponse>('/classes', studentId, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },
    createHold(classId: string) {
      return apiRequest<CreateHoldResponse>(`/classes/${classId}/holds`, studentId, {
        method: 'POST',
      })
    },
    getHold(holdId: string) {
      return apiRequest<HoldResponse>(`/holds/${holdId}`, studentId)
    },
    confirmHold(holdId: string) {
      return apiRequest<ConfirmHoldResponse>(`/holds/${holdId}/confirm`, studentId, {
        method: 'POST',
      })
    },
    cancelHold(holdId: string) {
      return apiRequest<void>(`/holds/${holdId}`, studentId, {
        method: 'DELETE',
      })
    },
    getMyHolds() {
      return apiRequest<MyHoldResponse[]>('/me/holds', studentId)
    },
  }
}
