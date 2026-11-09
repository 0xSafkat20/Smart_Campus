import { useState } from 'react'
import './App.css'
import { DashboardShell } from './components/DashboardShell'
import { StudentIdentityScreen } from './components/StudentIdentityScreen'
import {
  clearStoredStudentId,
  getStoredStudentId,
  storeStudentId,
} from './studentIdentity'

function App() {
  const [studentId, setStudentId] = useState<string | null>(getStoredStudentId)

  function handleContinue(nextStudentId: string) {
    storeStudentId(nextStudentId)
    setStudentId(nextStudentId)
  }

  function handleChangeStudent() {
    clearStoredStudentId()
    setStudentId(null)
  }

  return studentId ? (
    <DashboardShell studentId={studentId} onChangeStudent={handleChangeStudent} />
  ) : (
    <StudentIdentityScreen onContinue={handleContinue} />
  )
}

export default App
