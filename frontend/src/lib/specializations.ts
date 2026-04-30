// Centralized specialization constants for the entire application
// These must match the backend Specialization enum

export interface SpecializationOption {
  value: string;
  label: string;
}

// All specializations including COMMON (for filtering notes/papers)
export const ALL_SPECIALIZATIONS: SpecializationOption[] = [
  { value: 'BIT', label: 'BIT' },
  { value: 'ACCOUNTING', label: 'ACCOUNTING' },
  { value: 'FINANCE AND BANKING', label: 'FINANCE AND BANKING' },
  { value: 'BUSINESS LEADERSHIP', label: 'BUSINESS LEADERSHIP' },
  { value: 'RISK AND INSURANCE', label: 'RISK AND INSURANCE' },
  { value: 'MARKETING', label: 'MARKETING' },
  { value: 'COMMON', label: 'COMMON' },
  { value: 'HUMAN RESOURCE MNGMT', label: 'HUMAN RESOURCE MNGMT' },
  { value: 'PURCHASING AND SUPPLY', label: 'PURCHASING AND SUPPLY' },
  { value: 'SMALL ENTERPRISE MNGMT', label: 'SMALL ENTERPRISE MNGMT' },
  { value: 'OTHER', label: 'OTHER' },
];

// User specializations (excludes COMMON - only for units, not users)
export const USER_SPECIALIZATIONS: SpecializationOption[] = ALL_SPECIALIZATIONS.filter(
  s => s.value !== 'COMMON'
);

// Specialization values as constants for type safety
export const SPECIALIZATION_VALUES = {
  BIT: 'BIT',
  ACCOUNTING: 'ACCOUNTING',
  FINANCE_AND_BANKING: 'FINANCE AND BANKING',
  BUSINESS_LEADERSHIP: 'BUSINESS LEADERSHIP',
  RISK_AND_INSURANCE: 'RISK AND INSURANCE',
  MARKETING: 'MARKETING',
  COMMON: 'COMMON',
  HUMAN_RESOURCE_MNGMT: 'HUMAN RESOURCE MNGMT',
  PURCHASING_AND_SUPPLY: 'PURCHASING AND SUPPLY',
  SMALL_ENTERPRISE_MNGMT: 'SMALL ENTERPRISE MNGMT',
  OTHER: 'OTHER',
} as const;

export type SpecializationValue = typeof SPECIALIZATION_VALUES[keyof typeof SPECIALIZATION_VALUES];
