import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RequireAuth, RequireGuest, RequireLicense } from '@/components/shared/RouteGuard'
import { PageSpinner } from '@/components/ui/Spinner'

const HomePage = lazy(() => import('@/pages/home/HomePage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ContactBarberOSPage = lazy(() => import('@/pages/auth/ContactBarberOSPage'))
const JoinBarbershopPage = lazy(() => import('@/pages/auth/JoinBarbershopPage'))
const SuperAdminPage = lazy(() => import('@/pages/superadmin/SuperAdminPage'))
const BarberDashboardPage = lazy(() => import('@/pages/dashboard/BarberDashboardPage'))
const CustomerDashboardPage = lazy(() => import('@/pages/dashboard/CustomerDashboardPage'))
const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'))
const AppointmentsPage = lazy(() => import('@/pages/appointments/AppointmentsPage'))
const CustomerAppointmentsPage = lazy(() => import('@/pages/appointments/CustomerAppointmentsPage'))
const PostsPage = lazy(() => import('@/pages/posts/PostsPage'))
const ClientsPage = lazy(() => import('@/pages/clients/ClientsPage'))
const InvitationCodesPage = lazy(() => import('@/pages/invitation-codes/InvitationCodesPage'))
const BarbershopCodePage = lazy(() => import('@/pages/barbershop-code/BarbershopCodePage'))
const BarbersPage = lazy(() => import('@/pages/barbers/BarbersPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))

const Fallback = (
  <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
    <PageSpinner />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={Fallback}>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
            <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />

            {/* Post-registro barber (requiere auth) */}
            <Route path="/contact-barberos" element={<RequireAuth><ContactBarberOSPage /></RequireAuth>} />

            {/* Join con código (requiere auth de customer sin tenant) */}
            <Route path="/join" element={<RequireAuth><JoinBarbershopPage /></RequireAuth>} />

            {/* SuperAdmin */}
            <Route path="/super-admin" element={<RequireAuth><SuperAdminPage /></RequireAuth>} />

            {/* Panel de barbería (dueño/barbero) */}
            <Route path="/barberia" element={<RequireAuth><RequireLicense><AdminLayout /></RequireLicense></RequireAuth>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<BarberDashboardPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="barbers" element={<BarbersPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="invitation-codes" element={<InvitationCodesPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Panel de usuario/cliente */}
            <Route path="/user" element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CustomerDashboardPage />} />
              <Route path="appointments" element={<CustomerAppointmentsPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="barbershop-code" element={<BarbershopCodePage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
