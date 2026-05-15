import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const [myBookings, serviceBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            price: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.booking.findMany({
      where: { service: { userId: session.user.id } },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          Track your service requests and requests submitted to your own services.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Requests</CardTitle>
            <CardDescription>Bookings you submitted for other services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings submitted yet.</p>
            ) : (
              myBookings.map(booking => (
                <div key={booking.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium">{booking.service.title}</p>
                    <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Provider: {booking.service.user.name ?? booking.service.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Scheduled: {booking.date.toISOString().slice(0, 10)}
                    {booking.time ? ` at ${booking.time}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests For My Services</CardTitle>
            <CardDescription>Bookings customers placed on your listed services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customer bookings yet.</p>
            ) : (
              serviceBookings.map(booking => (
                <div key={booking.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium">{booking.service.title}</p>
                    <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer: {booking.user.name ?? booking.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Scheduled: {booking.date.toISOString().slice(0, 10)}
                    {booking.time ? ` at ${booking.time}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Service price: ${booking.service.price}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
