import React from 'react';

interface MentorFiltersProps {
  specialties: string[];
  selectedSpecialty: string;
  setSelectedSpecialty: (s: string) => void;
  priceRange: string;
  setPriceRange: (p: string) => void;
  showCertifiedOnly: boolean;
  setShowCertifiedOnly: (b: boolean) => void;
}

const MentorFilters: React.FC<MentorFiltersProps> = ({
  specialties,
  selectedSpecialty,
  setSelectedSpecialty,
  priceRange,
  setPriceRange,
  showCertifiedOnly,
  setShowCertifiedOnly,
}) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      {/* Specialty Filter */}
      <select
        className="rounded border bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        value={selectedSpecialty}
        onChange={e => setSelectedSpecialty(e.target.value)}
      >
        <option value="">All Specialties</option>
        {specialties.map(s => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Price Range Filter */}
      <select
        className="rounded border bg-white px-3 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        value={priceRange}
        onChange={e => setPriceRange(e.target.value)}
      >
        <option value="">All Prices</option>
        <option value="under-100">Under $100/hr</option>
        <option value="100-150">$100–$150/hr</option>
        <option value="150-200">$150–$200/hr</option>
        <option value="over-200">Over $200/hr</option>
      </select>

      {/* Certified Only Toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={showCertifiedOnly}
          onChange={e => setShowCertifiedOnly(e.target.checked)}
          className="form-checkbox h-4 w-4 text-primary"
        />
        <span className="text-gray-700 dark:text-gray-200">StackZen Certified Only</span>
      </label>
    </div>
  );
};

export default MentorFilters;
