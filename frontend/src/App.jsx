import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import {
  AdminDashboard, TeacherDashboard,
  StudentDashboard, ParentDashboard
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
import SubjectsPage from './pages/SubjectsPage'
import MyAttendancePage from './pages/MyAttendancePage'
import RegradeRequestsPage from './pages/RegradeRequestsPage'
import DirectorRegistrationPage from './pages/DirectorRegistrationPage'
import TeacherRegistrationPage from './pages/TeacherRegistrationPage'
import AdminTeacherRegistrationPage from './pages/AdminTeacherRegistrationPage'
import UserLookupPage from './pages/UserLookupPage'
import GradeEntryWindowPage from './pages/GradeEntryWindowPage'

function RoleHomeRedirect() {
  const { user, isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <Navigate to={
    user.role === 'ADMIN' ? '/admin' :
      user.role === 'TEACHER' ? '/teacher' :
        user.role === 'STUDENT' ? '/student' : '/parent'
  } replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><StudentsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><TeachersPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><ClassesPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/grades"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><GradebookPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><AttendancePage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-log"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><AuditLogPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subjects"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><SubjectsPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/regrade-requests"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><RegradeRequestsPage /></Layout>
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
      <Route
        path="/admin/grade-entry"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><GradeEntryWindowPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/registration"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><DirectorRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teacher-registration"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <Layout><AdminTeacherRegistrationPage /></Layout>
          </ProtectedRoute>
        }
      />

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

      <Route
        path="/notices"
        element={
          <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
            <Layout><NoticeBoardPage /></Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
            <Layout><ResourcesPage /></Layout>
          </ProtectedRoute>
        }
      />

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

      <Route path="/" element={<RoleHomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />

      {/* Account page — every authenticated role */}
      <Route
        path="/account"
        element={
          <ProtectedRoute roles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
            <Layout><AccountPage /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
