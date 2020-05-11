import {Writer} from './writer';

export class RW {
  static toBuffer(value: unknown): Buffer {
    const writer = new Writer();
    writer.handle(value);
    return writer.toBuffer();
  }

  /*static fromBuffer<T>(from: Buffer): T {
    const reader = new Reader(from);
  }*/
}
