'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface PersonalProfileData {
  age: number;
  occupation: string;
  education: string;
  maritalStatus: string;
  dependents: number;
  location: string;
}

interface OnboardingStepPersonalProfileProps {
  onNext: (data: PersonalProfileData) => void;
}

const OnboardingStepPersonalProfile: React.FC<OnboardingStepPersonalProfileProps> = ({
  onNext,
}) => {
  const [formData, setFormData] = useState<PersonalProfileData>({
    age: 25,
    occupation: '',
    education: '',
    maritalStatus: '',
    dependents: 0,
    location: '',
  });

  const handleInputChange = (field: keyof PersonalProfileData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Tell us about yourself</h2>
        <p className="text-gray-600">This helps us personalize your financial journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            min="18"
            max="100"
            value={formData.age}
            onChange={e => handleInputChange('age', parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            value={formData.occupation}
            onChange={e => handleInputChange('occupation', e.target.value)}
            placeholder="e.g., Software Engineer, Teacher, Entrepreneur"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Education Level</label>
          <select
            value={formData.education}
            onChange={e => handleInputChange('education', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select education level</option>
            <option value="high-school">High School</option>
            <option value="some-college">Some College</option>
            <option value="bachelors">Bachelor&apos;s Degree</option>
            <option value="masters">Master&apos;s Degree</option>
            <option value="doctorate">Doctorate</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marital Status</label>
          <select
            value={formData.maritalStatus}
            onChange={e => handleInputChange('maritalStatus', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select marital status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
            <option value="domestic-partnership">Domestic Partnership</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Number of Dependents
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.dependents}
            onChange={e => handleInputChange('dependents', parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Location (City, State)
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={e => handleInputChange('location', e.target.value)}
            placeholder="e.g., San Francisco, CA"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-green-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-green-700"
        >
          Continue
        </button>
      </form>
    </motion.div>
  );
};

export default OnboardingStepPersonalProfile;
