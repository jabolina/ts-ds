import {Writer} from './writer';

export class RW {
  static toBuffer(value: unknown): Buffer {
    const writer = new Writer();
    writer.handle(value);
    return writer.toBuffer();
  }
}
