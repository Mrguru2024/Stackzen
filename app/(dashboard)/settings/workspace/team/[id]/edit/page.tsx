interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamMemberEditPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit member</h1>
      <p className="text-muted-foreground">Member ID: {id}</p>
    </div>
  );
}
