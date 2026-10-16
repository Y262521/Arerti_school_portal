import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import {
  AdminDashboard, TeacherDashboard,
  StudentDashboard, ParentDashboard,
  ViceDirectorDashboard, SupervisorDashboard
} from './pages/Dashboards'
import { ForbiddenPage, NotFoundPage } from './pages/InfoPages'
import StudentsPage from './pages/StudentsPage'
import TeachersPage from './pages/TeachersPage'
import ClassesPage from './pages/ClassesPage'
import NoticeBoardPage from './pages/NoticeBoardPage'
import GradebookPage from './pages/GradebookPage'
import AttendancePage from './pages/AttendancePage'
import MyGradesPage from './pages/MyGradesPage'
import ResourcesPage from './pages/ResourcesPage'
import ParentChildrenPage from './pages/ParentChildrenPage'
import AuditLogPage from './pages/AuditLogPage'
import AccountPage from './pages/AccountPage'
import ParentReportCardPage from './pages/ParentReportCardPage'
import ParentAttendancePage from './pages/ParentAttendancePage'
import SubjectsPage from './pages/SubjectsPage'
import MyAttendancePage from './pages/MyAttendancePage'
import RegradeRequestsPage from './pages/RegradeRequestsPage'
import DirectorRegistrationPage from './pages/DirectorRegistrationPage'
import TeacherRegistrationPage from './pages/TeacherRegistrationPage'
import AdminTeacherRegistrationPage from './pages/AdminTeacherRegistrationPage'
import ViceDirectorRegistrationPage from './pages/ViceDirectorRegistrationPage'
import SupervisorRegistrationPage from './pages/SupervisorRegistrationPage'
import SupervisorClassesPage from './pages/SupervisorClassesPage'
import SupervisorAttendancePage from './pages/SupervisorAttendancePage'
import UserLookupPage from './pages/UserLookupPage'
import GradeEntryWindowPage from './pages/GradeEntryWindowPage'
import PrintReportCardPage from './pages/PrintReportCardPage'
import MyStaffAttendancePage from './pages/MyStaffAttendancePage'
import StaffAttendancePage from './pages/StaffAttendancePage'

function RoleHomeRedirect() {
  const { user, isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <Navigate to={
    user.role === 'ADMIN'          ? '/admin' :
    user.role === 'VICE_DIRECTOR'  ? '/admin' :
    user.role === 'SUPERVISOR'     ? '/supervisor' :
    user.role === 'TEACHER'        ? '/teacher' :
    user.role === 'STUDENT'        ? '/student' : '/parent'
  } replace />
}

function ViceDirectorDashboardOrAdmin() {
  const { user } = useAuth()
  if (user?.role === 'VICE_DIRECTOR') return <ViceDirectorDashboard />
  return <AdminDashboard />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route
        path="/print/report-card"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR', 'SUPERVISOR', 'TEACHER', 'STUDENT', 'PARENT']}>
            <PrintReportCardPage />
          </ProtectedRoute>
        }
      />

      {/* ── Admin / Vice Director shared routes ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><ViceDirectorDashboardOrAdmin /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><StudentsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><TeachersPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><ClassesPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/grades"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><GradebookPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><AttendancePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><SubjectsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/regrade-requests"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><RegradeRequestsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/grade-entry"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><GradeEntryWindowPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/registration"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><DirectorRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teacher-registration"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><AdminTeacherRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff-attendance"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR']}>
            <Layout><StaffAttendancePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── ADMIN-only routes (no Vice Director) ── */}
      <Route
        path="/admin/audit-log"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><AuditLogPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/user-lookup"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><UserLookupPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── Vice Director registration (ADMIN only) ── */}
      <Route
        path="/admin/vice-director-registration"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><ViceDirectorRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/supervisor-registration"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><SupervisorRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── Supervisor routes ── */}
      <Route
        path="/supervisor"
        element={
          <ProtectedRoute roles={['SUPERVISOR']}>
            <Layout><SupervisorDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/classes"
        element={
          <ProtectedRoute roles={['SUPERVISOR']}>
            <Layout><SupervisorClassesPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/attendance"
        element={
          <ProtectedRoute roles={['SUPERVISOR']}>
            <Layout><SupervisorAttendancePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── Teacher routes ── */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={['TEACHER']}>
            <Layout><TeacherDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades"
        element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <Layout><GradebookPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
            <Layout><AttendancePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/registration"
        element={
          <ProtectedRoute roles={['TEACHER']}>
            <Layout><TeacherRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/my-attendance"
        element={
          <ProtectedRoute roles={['TEACHER']}>
            <Layout><MyStaffAttendancePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── Student routes ── */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/grades"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <Layout><MyGradesPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <Layout><MyAttendancePage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── Shared routes ── */}
      <Route
        path="/notices"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR', 'SUPERVISOR', 'TEACHER', 'STUDENT', 'PARENT']}>
            <Layout><NoticeBoardPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR', 'SUPERVISOR', 'TEACHER', 'STUDENT']}>
            <Layout><ResourcesPage /></Layout>
          </ProtectedRoute>
        }
      />

      {/* ── Parent routes ── */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute roles={['PARENT']}>
            <Layout><ParentDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/children"
        element={
          <ProtectedRoute roles={['PARENT']}>
            <Layout><ParentChildrenPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/report-cards"
        element={
          <ProtectedRoute roles={['PARENT']}>
            <Layout><ParentReportCardPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parent/attendance"
        element={
          <ProtectedRoute roles={['PARENT']}>
            <Layout><ParentAttendancePage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<RoleHomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />

      {/* Account page — every authenticated role */}
      <Route
        path="/account"
        element={
          <ProtectedRoute roles={['ADMIN', 'VICE_DIRECTOR', 'SUPERVISOR', 'TEACHER', 'STUDENT', 'PARENT']}>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
