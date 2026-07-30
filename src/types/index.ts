// ─── User & Auth Types ────────────────────────────────────────────
export type UserRole = "admin" | "doctor" | "patient";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─── Patient Types ────────────────────────────────────────────────
export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  bloodGroup: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: string;
  medicalHistory: MedicalRecord[];
  createdAt: string;
  updatedAt: string;
}

// ─── Doctor Types ─────────────────────────────────────────────────
export interface Doctor {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  experience: number; // years
  qualifications: string[];
  availability: Availability[];
  departmentId: string;
  consultationFee: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday ...
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
}

// ─── Appointment Types ────────────────────────────────────────────
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Department Types ─────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  description: string;
  headDoctorId?: string;
  location: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Medical Record Types ─────────────────────────────────────────
export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis: string;
  prescription: Prescription[];
  labResults?: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// ─── Billing Types ────────────────────────────────────────────────
export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  tax: number;
  total: number;
  status: PaymentStatus;
  items: InvoiceItem[];
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Dashboard & Stats Types ──────────────────────────────────────
export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  upcomingAppointments: number;
  pendingPayments: number;
}

export interface RecentActivity {
  id: string;
  type: "appointment" | "admission" | "discharge" | "payment" | "registration";
  description: string;
  timestamp: string;
  userId: string;
}

// ─── API Response Types ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Form Types ───────────────────────────────────────────────────
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  phone?: string;
}
