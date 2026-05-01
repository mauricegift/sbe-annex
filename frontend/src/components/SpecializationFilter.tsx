import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ALL_SPECIALIZATIONS, USER_SPECIALIZATIONS } from '../lib/specializations';

interface SpecializationFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  specializations?: string[];
}

// For browse filtering (shows "All specializations" option + dynamic list)
export const SpecializationFilter: React.FC<SpecializationFilterProps> = ({
  value,
  onChange,
  label = 'Specialization',
  placeholder = 'All specializations',
  specializations,
}) => {
  const items = specializations && specializations.length > 0
    ? specializations.map((s) => ({ value: s, label: s }))
    : ALL_SPECIALIZATIONS;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All specializations</SelectItem>
          {items.map((spec) => (
            <SelectItem key={spec.value} value={spec.value}>
              {spec.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// For user profile editing (excludes COMMON)
export const SpecializationSelect: React.FC<SpecializationFilterProps> = ({
  value,
  onChange,
  label = 'Specialization',
  placeholder = 'Select specialization',
  specializations,
}) => {
  const items = specializations && specializations.length > 0
    ? specializations.map((s) => ({ value: s, label: s }))
    : USER_SPECIALIZATIONS;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((spec) => (
            <SelectItem key={spec.value} value={spec.value}>
              {spec.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// For content (notes/papers) - includes COMMON; always has a "None" option so specialization is optional
export const ContentSpecializationSelect: React.FC<SpecializationFilterProps> = ({
  value,
  onChange,
  label = 'Specialization',
  placeholder = 'None (All specializations)',
  specializations,
}) => {
  const items = specializations && specializations.length > 0
    ? specializations.map((s) => ({ value: s, label: s }))
    : ALL_SPECIALIZATIONS;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || '__none'} onValueChange={(v) => onChange(v === '__none' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">{placeholder}</SelectItem>
          {items.map((spec) => (
            <SelectItem key={spec.value} value={spec.value}>
              {spec.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SpecializationFilter;
