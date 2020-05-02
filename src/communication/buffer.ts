import Sender from './sender';
import {Frame} from './frame';

export class Envelope {
  readonly id: number;
  readonly data: Frame;
  readonly tag: Buffer;
  readonly sender: Sender;

  constructor(id: number, data: Frame, tag: Buffer, sender: Sender) {
    this.id = id;
    this.data = data;
    this.tag = tag;
    this.sender = sender;
  }
}

export class CircularBuffer {
  readonly capacity: number;
  private size: number;
  private head: number;
  private tail: number;
  private entries: (Envelope | undefined)[];

  constructor(capacity: number) {
    this.capacity = capacity;
    this.size = 0;
    this.head = 0;
    this.tail = 0;
    this.entries = [];
  }

  available() {
    return this.capacity - this.size;
  }

  state() {
    return {
      capacity: this.capacity,
      head: this.head,
      tail: this.tail,
      size: this.size,
    };
  }

  push(envelope: Envelope): boolean {
    if (this.size < this.capacity) {
      this.entries[this.tail] = envelope;
      this.tail = (this.tail + 1) % this.capacity;
      this.size++;
      return true;
    }
    throw new Error(`Buffer overflow: ${JSON.stringify(this.state())}`);
  }

  deleteIf(filter: (envelope: Envelope) => boolean) {
    while (
      this.size &&
      this.entries[this.head] &&
      filter(this.entries[this.head]!)
    ) {
      this.entries[this.head] = undefined;
      this.head = (this.head + 1) % this.capacity;
      this.size--;
    }
  }

  poll(id: number): Envelope | undefined {
    if (this.size && this.entries[this.head]) {
      const gap = id - this.entries[this.head]!.id;
      if (gap < this.size) {
        return this.entries[(this.head + gap) % this.capacity];
      }
    }
    return undefined;
  }
}
