// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
  tenantId?: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  // The join/join-by-token responses carry tenant info instead of user identity
  // fields (the user was already authenticated before joining) — these are
  // optional here and AuthContext.setTokens falls back to the previously
  // stored user for whichever of these it doesn't get.
  userId?: string
  fullName?: string
  email?: string
  role?: string
  tenantId?: string | null
  tenantSlug?: string | null
  tenantName?: string
  licensePending?: boolean
}

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  tenantId?: string | null
  tenantSlug?: string | null
  licensePending?: boolean
  displayName?: string | null
  avatarUrl?: string | null
}

export interface MyProfile {
  id: string
  email: string
  fullName: string
  displayName?: string | null
  phone?: string | null
  avatarUrl?: string | null
  role: string
  isSuperAdmin: boolean
}

export interface UpdateProfileRequest {
  fullName: string
  displayName?: string | null
  email: string
  phone?: string | null
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface MyTenant {
  tenantId: string
  name: string
  slug: string
  role: string
  status: string
  logoUrl?: string | null
}

export interface RegisterBarberRequest {
  email: string
  fullName: string
  password: string
  barbershopName: string
  phone?: string
}

export interface RegisterCustomerRequest {
  email: string
  fullName: string
  password: string
  phone?: string
}

// ── Tenant ────────────────────────────────────────────────────────────────────
export interface RegisterTenantRequest {
  name: string
  slug: string
  ownerFullName: string
  ownerEmail: string
  ownerPassword: string
  country: string
  timezone: string
  currency: string
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface Service {
  id: string
  name: string
  description?: string
  durationMinutes: number
  price: number
  currency: string
  category?: string
  isActive: boolean
  sortOrder: number
}

export interface CreateServiceRequest {
  name: string
  description?: string
  durationMinutes: number
  price: number
  currency: string
  category?: string
}

export interface UpdateServiceRequest extends CreateServiceRequest {
  isActive: boolean
  sortOrder: number
}

// ── Barber ────────────────────────────────────────────────────────────────────
export interface Barber {
  id: string
  displayName: string
  phone?: string
  photoUrl?: string
  isActive: boolean
}

export interface CreateBarberRequest {
  displayName: string
  phone?: string
}

export interface UpdateBarberRequest {
  displayName: string
  phone?: string
  photoUrl?: string
  isActive: boolean
}

export interface WorkSchedule {
  weekday: number
  startTime: string
  endTime: string
  breakStart?: string | null
  breakEnd?: string | null
}

// ── Customer ──────────────────────────────────────────────────────────────────
export interface Customer {
  id: string
  fullName: string
  phone: string
  email?: string
  notes?: string
  noShowCount: number
  isBlocked: boolean
  bookingBlockedUntil?: string
  blockReason?: string
}

export interface CreateCustomerRequest {
  fullName: string
  phone: string
  email?: string
  notes?: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

// ── Appointment ───────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'InProgress'
  | 'Completed'
  | 'CancelledByCustomer'
  | 'CancelledByBarber'
  | 'NoShow'

export interface AppointmentAddOn {
  name: string
  price: number
}

export interface Appointment {
  id: string
  customerId: string
  customerName: string
  barberId: string
  barberName: string
  serviceId: string
  serviceName: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  notes?: string
  servicePrice: number
  penaltyAmount?: number
  penaltyReason?: string
  isRated?: boolean
  addOns?: AppointmentAddOn[]
  totalPrice?: number
  tenantId?: string
  tenantName?: string
}

export interface BookAppointmentRequest {
  customerId?: string
  barberId: string
  serviceId: string
  startsAt: string
  notes?: string
  addOns?: AppointmentAddOn[]
}

export interface AvailableSlot {
  startsAt: string
  endsAt: string
}

// ── API Error ─────────────────────────────────────────────────────────────────
export interface ApiError {
  title: string
  status: number
  errorCode?: string
  traceId?: string
}
