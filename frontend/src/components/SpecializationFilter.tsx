import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ALL_SPECIALIZATIONS, USER_SPECIALIZATIONS } from '../lib/specializations';

interface SpecializationFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const SpecializationFilter: React.FC<SpecializationFilterProps> = ({
  value,
  onChange,
  label = 'Specialization',
  placeholder = 'All specializations'
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All specializations</SelectItem>
          {ALL_SPECIALIZATIONS.map((spec) => (
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
  placeholder = 'Select specialization'
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {USER_SPECIALIZATIONS.map((spec) => (
            <SelectItem key={spec.value} value={spec.value}>
              {spec.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// For content (notes/papers) - includes COMMON
export const ContentSpecializationSelect: React.FC<SpecializationFilterProps> = ({
  value,
  onChange,
  label = 'Specialization',
  placeholder = 'Select specialization'
}) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {ALL_SPECIALIZATIONS.map((spec) => (
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
