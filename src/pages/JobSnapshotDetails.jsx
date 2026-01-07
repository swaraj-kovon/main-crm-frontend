import React from 'react';

const DetailItem = ({ label, value }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
};

const ListDetail = ({ label, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <ul className="list-disc list-inside text-sm text-gray-800 pl-2">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-4 p-4 border rounded-lg bg-gray-50">
    <h4 className="font-bold text-md mb-3 border-b pb-2 text-gray-700">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
      {children}
    </div>
  </div>
);

const JobSnapshotDetails = ({ snapshot }) => {
  if (!snapshot) return <p>No job snapshot available.</p>;

  const {
    title,
    description,
    responsibilities,
    location,
    salary,
    company,
    candidateRequirements,
    facilitiesAndBenefits,
    type,
    positions,
  } = snapshot;

  return (
    <div className="text-left">
      <DetailItem label="Job Title" value={title} />
      <DetailItem label="Company" value={company?.name} />
      <DetailItem label="Description" value={description} />
      <DetailItem label="Responsibilities" value={responsibilities} />
      <DetailItem label="Job Type" value={type} />
      <DetailItem label="Positions Available" value={positions} />

      <Section title="Location">
        <DetailItem label="Country" value={location?.country} />
        <DetailItem label="State" value={location?.state} />
        <DetailItem label="City" value={location?.city} />
        <DetailItem label="Remote" value={location?.remote ? 'Yes' : 'No'} />
      </Section>

      {salary && (
        <Section title="Salary">
          <DetailItem label="Salary Range" value={`${salary.min || 'N/A'} - ${salary.max || 'N/A'} ${salary.currency}`} />
          <DetailItem label="Frequency" value={salary.frequency} />
        </Section>
      )}

      {candidateRequirements && (
        <Section title="Candidate Requirements">
          <DetailItem label="Gender" value={candidateRequirements.gender} />
          <DetailItem label="Minimum Experience" value={candidateRequirements.experience?.minimumYears ? `${candidateRequirements.experience.minimumYears} years` : null} />
          <ListDetail label="Certifications" items={candidateRequirements.certifications} />
        </Section>
      )}

    </div>
  );
};

export default JobSnapshotDetails;