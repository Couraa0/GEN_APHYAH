import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { dateRange, DateRangeDto } from '../common/date-range.dto.js';
import {
  OrganicRecordType,
  PickupStatus,
  Prisma,
  RequestStatus,
  WeighingStatus,
} from '../generated/prisma/client.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PrismaService } from '../prisma.service.js';

const ZERO = new Prisma.Decimal(0);
const sum = (values: (Prisma.Decimal | null | undefined)[]) =>
  values.reduce<Prisma.Decimal>((total, v) => total.add(v ?? 0), ZERO);

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  /** Ringkasan dampak: terkumpul, dipindahkan, terjual, dan hasil pilot pengolahan. */
  async summary(query: DateRangeDto) {
    const range = dateRange(query);
    const [categories, points, byCategory, byPoint, moved, sold, organic, plastic] =
      await Promise.all([
        this.prisma.wasteCategory.findMany(),
        this.prisma.collectionPoint.findMany({ orderBy: { name: 'asc' } }),
        this.prisma.collectionTransaction.groupBy({
          by: ['wasteCategoryId'],
          where: { recordedAt: range },
          _sum: { weightKg: true },
        }),
        this.prisma.collectionTransaction.groupBy({
          by: ['collectionPointId'],
          where: { recordedAt: range },
          _sum: { weightKg: true },
          _count: true,
        }),
        this.prisma.pickupSchedule.aggregate({
          where: { status: PickupStatus.DONE, scheduledAt: range },
          _sum: { movedWeightKg: true },
          _count: true,
        }),
        this.prisma.sale.aggregate({
          where: { soldAt: range },
          _sum: { weightKg: true, totalAmount: true },
          _count: true,
        }),
        this.prisma.organicRecord.groupBy({
          by: ['type'],
          where: { recordedAt: range },
          _sum: { weightKg: true },
        }),
        this.prisma.plasticExperiment.aggregate({
          where: { conductedAt: range },
          _sum: { plasticWeightKg: true, prototypeCount: true },
          _count: true,
        }),
      ]);

    const collectedByCategory = byCategory
      .map((row) => {
        const category = categories.find((c) => c.id === row.wasteCategoryId);
        return {
          id: row.wasteCategoryId,
          name: category?.name ?? '-',
          group: category?.group,
          weightKg: row._sum.weightKg ?? ZERO,
        };
      })
      .sort((a, b) => b.weightKg.cmp(a.weightKg));
    const organicKg = (type: OrganicRecordType) =>
      organic.find((o) => o.type === type)?._sum.weightKg ?? ZERO;

    return {
      collected: {
        totalKg: sum(collectedByCategory.map((c) => c.weightKg)),
        count: byPoint.reduce((n, p) => n + p._count, 0),
        byCategory: collectedByCategory,
        // Keempat titik selalu tampil, termasuk yang belum ada aktivitas.
        byPoint: points.map((p) => {
          const row = byPoint.find((b) => b.collectionPointId === p.id);
          return {
            id: p.id,
            name: p.name,
            weightKg: row?._sum.weightKg ?? ZERO,
            count: row?._count ?? 0,
          };
        }),
      },
      moved: { totalKg: moved._sum.movedWeightKg ?? ZERO, count: moved._count },
      sold: {
        totalKg: sold._sum.weightKg ?? ZERO,
        totalAmount: sold._sum.totalAmount ?? ZERO,
        count: sold._count,
      },
      organic: {
        feedingKg: organicKg(OrganicRecordType.FEEDING),
        harvestKg: organicKg(OrganicRecordType.HARVEST),
        frassKg: organicKg(OrganicRecordType.FRASS),
      },
      plastic: {
        processedKg: plastic._sum.plasticWeightKg ?? ZERO,
        experiments: plastic._count,
        prototypes: plastic._sum.prototypeCount ?? 0,
      },
    };
  }

  async dashboard() {
    const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    const [summary, stock, upcomingPickups, pendingWeighings, pendingRequests, trend] =
      await Promise.all([
        this.summary({}),
        this.inventory.stock(),
        this.prisma.pickupSchedule.findMany({
          where: {
            status: { in: [PickupStatus.SCHEDULED, PickupStatus.IN_PROGRESS] },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
          include: {
            collectionPoint: { select: { name: true } },
            assignedTo: { select: { name: true } },
          },
        }),
        this.prisma.weighingRecord.count({
          where: { status: WeighingStatus.PENDING },
        }),
        this.prisma.marketplaceRequest.count({
          where: { status: RequestStatus.PENDING },
        }),
        // Total harian 14 hari terakhir, dikelompokkan per hari waktu Indonesia Barat.
        this.prisma.$queryRaw<{ day: string; weightKg: number }[]>`
          SELECT to_char(("recordedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS day,
                 SUM("weightKg")::float8 AS "weightKg"
          FROM collection_transactions
          WHERE "recordedAt" >= ${since}
          GROUP BY 1 ORDER BY 1`,
      ]);
    return {
      ...summary,
      stock,
      upcomingPickups,
      pending: { weighings: pendingWeighings, requests: pendingRequests },
      trend,
    };
  }
}

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('api')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.reports.dashboard();
  }

  /** Laporan untuk rentang tanggal (from/to, ISO 8601). Tanpa rentang = seluruh data. */
  @Get('reports')
  summary(@Query() query: DateRangeDto) {
    return this.reports.summary(query);
  }
}
