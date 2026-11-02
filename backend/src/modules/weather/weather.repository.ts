import { PrismaClient } from '@prisma/client';

export class WeatherRepository {
  constructor(private prisma: PrismaClient) {}

  findPackageLocation(packageId: string) {
    return this.prisma.package.findFirst({
      where: { id: packageId, isActive: true, deletedAt: null },
      select: {
        title: true,
        geoLatitude: true,
        geoLongitude: true,
        itinerary: {
          select: {
            details: {
              orderBy: { sortOrder: 'asc' },
              select: {
                itineraryTitle: true,
                origin: true,
                originCoordinate: true,
                originElevation: true,
                destination: true,
                destinationCoordinate: true,
                destinationElevation: true,
              },
            },
          },
        },
      },
    });
  }
}
