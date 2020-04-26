import {Timestamp} from './timestamp';

export class LogicalTimestamp implements Timestamp<LogicalTimestamp> {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  compareTo(other: LogicalTimestamp): number {
    return this.value - other.value;
  }

  public isNewerThan(other: LogicalTimestamp): boolean {
    return this.compareTo(other) > 0;
  }

  public isOlderThan(other: LogicalTimestamp): boolean {
    return this.compareTo(other) < 0;
  }
}
