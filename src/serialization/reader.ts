import {Read} from './read';
import {AnyAtom} from './base';
import {DoubleBE, Int16BE, Int32BE, Int8, UInt16BE, UInt32BE, UInt8,} from './atom/number';
import {NullAtom, UndefinedAtom} from './atom/empty';
import {StringAtom} from './atom/string';
import {BufferAtom} from './atom/buffer';
import {ArrayAtom} from './atom/array';
import {ObjectAtom} from './atom/object';

export class Reader {
  private readonly buffer: Buffer;
  private readonly read: Read;
  private readonly handlers: AnyAtom[];

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.read = new Read();
    this.handlers = this.createHandlers();
  }

  private createHandlers() {
    const available: AnyAtom[] = [
      new UInt8(),
      new Int8(),
      new UInt16BE(),
      new Int16BE(),
      new UInt32BE(),
      new Int32BE(),
      new DoubleBE(),
      new NullAtom(),
      new UndefinedAtom(),
      new StringAtom(new UInt32BE(), 'utf8'),
      new BufferAtom(new UInt32BE()),
    ];
    available.push(new ArrayAtom(new UInt32BE(), ...available));
    available.sort(({code}) => code);
    return available;
  }

  private pool(): number {
    const byte = this.buffer.readUInt8(this.read.offset, true);
    this.read.offset += 1;
    return byte;
  }

  private slice(upTo: number): Buffer {
    const read = this.buffer.slice(this.read.offset, this.read.offset + upTo);
    this.read.offset += upTo;
    return read;
  }

  private destructure(): [AnyAtom, Buffer] {
    const codeByte = this.pool();
    if (!this.handlers[codeByte]) {
      // fails
    }
    const handler =
      this.handlers[codeByte] ||
      new ObjectAtom(new UInt32BE(), [], ...this.handlers);
    const data = this.slice(this.buffer.length);
    return [handler, data];
  }

  handle<T>(): T {
    this.read.reset();
    const [handler, data] = this.destructure();
    if (this.buffer.length !== this.read.offset) {
      // still exists data on the buffer
    }
    this.read.reset();
    this.read.copy(handler.poolRead(this.read, data));
    if (this.read.err) {
      throw this.read.err;
    }
    return this.read.value;
  }
}
