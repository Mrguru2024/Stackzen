import React from 'react';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <div>Edit Quote Page for ID: {resolvedParams.id}</div>;
}
