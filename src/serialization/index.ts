import {Writer} from './writer';
import {Reader} from './reader';

export class RW {
  static toBuffer(value: unknown): Buffer {
    const writer = new Writer();
    writer.handle(value);
    return writer.toBuffer();
  }

  static fromBuffer<T>(from: Buffer): T {
    const reader = new Reader(from);
    return reader.handle();
  }
}
