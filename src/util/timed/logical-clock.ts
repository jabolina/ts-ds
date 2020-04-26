import {Clock} from './clock';
import {LogicalTimestamp} from './logical-timestamp';

export class LogicalClock implements Clock<LogicalTimestamp> {
  private timestamp: LogicalTimestamp;

  constructor(timestamp?: LogicalTimestamp) {
    this.timestamp = timestamp || new LogicalTimestamp(0);
  }

  time(): LogicalTimestamp {
    return this.timestamp;
  }

  update(timestamp: LogicalTimestamp): LogicalTimestamp {
    if (timestamp.isNewerThan(this.timestamp)) {
      this.timestamp = timestamp;
    }
    return this.timestamp;
  }

  increment(): LogicalTimestamp {
    return this.update(new LogicalTimestamp(this.timestamp.value + 1));
  }
}
