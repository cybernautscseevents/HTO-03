export type Language = 'en' | 'hi' | 'kn';
export type ThemeMode = 'dark' | 'light';
export type PortalMode = 'overview' | 'worker' | 'giver';
export type WorkerTab = 'jobs' | 'contracts' | 'credits' | 'card' | 'profile';
export type GiverTab = 'request' | 'vacancies' | 'matches' | 'history';
export type ScreenId =
  | 'overview'
  | 'worker-auth'
  | 's2' // worker voice signup
  | 's3' // worker confirm profile
  | 's7' // worker dashboard / dispatch
  | 's9' // worker portable work card
  | 'giver-auth'
  | 's4' // customer request (voice / photo)
  | 's5' // ranked matches
  | 's6' // booking status & tracking
  | 's8'; // customer rating

export interface WorkerProfile {
  id: number;
  name: string;
  trade: string;
  experience_years: number | null;
  areas: string[];
  skills: string[];
  rate_note: string;
  phone: string;
  trust_score: number;
  jobs_done: number;
  stars: number;
  rehire_pct: number;
  verified: boolean;
  free_today: boolean;
  missing: string[];
  created_at?: string;
}

export interface CustomerProfile {
  id: number;
  name: string;
  phone: string;
  area: string;
  bookings_count: number;
  company_name?: string;
  license_number?: string;
  saved_at?: string;
}

export interface CustomerRequest {
  request_id: number;
  trade: string;
  task: string;
  urgency: 'now' | 'today' | 'scheduled';
  when: string;
  area: string;
  transcript: string;
  has_photo?: boolean;
  photo_preview?: string;
  clarifying_question?: string | null;
}

export interface MatchedWorker {
  id: number;
  name: string;
  trade: string;
  stars: number;
  jobs: number;
  distance_km: number;
  trust: number;
  score: number;
  reasons: string[];
  free: string;
  phone: string;
  skills: string[];
  rate_note?: string;
}

export interface LiveTrackingSession {
  job_id: number;
  lat: number;
  lon: number;
  locality: string;
  active: boolean;
  sos_triggered: boolean;
  emergency_contact: string;
  last_ping_time: string;
  eta_minutes: number;
}

export interface CashAgreement {
  job_id: number;
  agreed_price: number;
  task_scope: string;
  recorded_transcript: string;
  confirmed_by_worker: boolean;
  confirmed_by_customer: boolean;
  locked_at: string;
  payment_mode: 'cash';
}

export interface JobState {
  id: number;
  request_id: number;
  task: string;
  trade: string;
  area: string;
  when: string;
  urgency: 'now' | 'today' | 'scheduled';
  worker: MatchedWorker;
  status: 'sent' | 'accepted' | 'done';
  phone_revealed: string | null;
  created_at: number;
  shared_with_contact: boolean;
  tracking?: LiveTrackingSession;
  cash_agreement?: CashAgreement;
}

export interface RatingSubmission {
  job_id: number;
  worker_id: number;
  stars: number;
  rehire: boolean;
  tags: string[];
}

export interface MasonJobListing {
  id: string;
  contractorName: string;
  contractorRating: number;
  contractorVerification: 'A-Grade Civil' | 'Govt Empanelled' | 'Verified Builder';
  title: string;
  location: string;
  distanceKm: number;
  contractTerm: 'Daily Wage' | '15-Day Contract' | '5-Day Milestone' | '1-Month Project';
  dailyWage: number;
  wageNote: string;
  shifts: string;
  crewNeeded: string;
  skillsRequired: string[];
  perks: string[];
  startDate: string;
  selected?: boolean;
}

export interface CreditHistoryItem {
  id: string;
  points: number;
  reason: string;
  category: 'referral' | 'attendance' | 'quality' | 'punctuality' | 'milestone';
  date: string;
  badge?: string;
}

export interface ContractorRegistration {
  contractorName: string;
  companyName: string;
  phone: string;
  licenseNumber: string;
  projectTitle: string;
  area: string;
  siteAddress: string;
  contractDuration: string;
  labourTrade: string;
  labourersCount: number;
  shiftHours: string;
  dailyWageOffered: number;
  amenities: string[];
  additionalNotes: string;
}

export interface ContractorVacancyApplicant {
  id: string;
  name: string;
  trade: string;
  experienceYears: number;
  trustScore: number;
  rating: number;
  area: string;
  wageExpectation: number;
  skills: string[];
  phone: string;
  status: 'pending' | 'accepted' | 'declined';
  appliedAt: string;
}

export interface ContractorVacancy {
  id: string;
  title: string;
  location: string;
  contractTerm: string;
  dailyWage: number;
  labourersNeeded: number;
  hiredCount: number;
  skillsRequired: string[];
  shifts: string;
  perks: string[];
  createdAt: string;
  status: 'active' | 'filled';
  applicants: ContractorVacancyApplicant[];
}
