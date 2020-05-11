import {Read} from './read';
import {AnyAtom} from './base';

export class Reader {
  private readonly buffer: Buffer;
  private readonly read: Read;
  private readonly handlers: AnyAtom[];

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.read = new Read();
    this.handlers = [];
  }

  peek(): number {
    const value = this.buffer[this.read.offset];
    if (value === undefined) {
      throw new Error('TODO: handle error');
    }
    return value;
  }

  size(): number {
    const next = this.peek();
    if (!(next & 0x80)) {
      // return this.uint8();
    }

    if (!(next & 0x40)) {
      // return this.uint16be() & 0x3fff;
    }

    if (!(next & 0x20)) {
      // return this.uint32be() & 0x1fffffff;
    }
    throw new Error('TODO: handle error');
  }

  skip() {
    this.read.offset += 1;
  }
}
