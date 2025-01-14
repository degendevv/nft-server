import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Collection } from "./collection";
import { HistoricalStatistic } from "./historical-statistic";

@Entity()
export class Statistic extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Collection, (collection) => collection.statistic, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn()
  collection: Collection;

  @Column({ type: "double precision" })
  dailyVolume: number;

  @Column({ type: "bigint" })
  @Index()
  dailyVolumeUSD: bigint;

  @Column({ type: "double precision" })
  totalVolume: number;

  @Column({ type: "bigint" })
  @Index()
  totalVolumeUSD: bigint;

  @Column({ type: "double precision" })
  marketCap: number;

  @Column({ type: "bigint" })
  @Index()
  marketCapUSD: bigint;

  @Column({ type: "double precision" })
  floor: number;

  @Column()
  @Index()
  floorUSD: number;

  @Column()
  @Index()
  owners: number;

  static async getSummary(): Promise<any> {
    const stats = await this.createQueryBuilder("statistic")
      .select("SUM(statistic.totalVolumeUSD)", "totalVolumeUSD")
      .addSelect("SUM(statistic.dailyVolumeUSD)", "dailyVolumeUSD")
      .getRawOne();

    const [today, yesterday] = await HistoricalStatistic.createQueryBuilder(
      "historical-statistic"
    )
      .select("SUM(historical-statistic.dailyVolume)", "dailyVolume")
      .groupBy("historical-statistic.timestamp")
      .orderBy({
        "historical-statistic.timestamp": "DESC",
      })
      .limit(2)
      .getRawMany();

    const percentChange =
      ((today.dailyVolume - yesterday.dailyVolume) / yesterday.dailyVolume) *
      100;
    return { ...stats, dailyChange: percentChange };
  }
}
