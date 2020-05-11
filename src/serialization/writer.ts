import {Write} from './write';
import {AnyAtom, FixedAtom, VariableAtom} from './base';
import {DoubleBE, Int16BE, Int32BE, Int8, UInt16BE, UInt32BE, UInt8,} from './atom/number';
import {ObjectAtom} from './atom/object';
import {singleton} from '../decorator/singleton';
import {NullAtom, UndefinedAtom} from './atom/empty';
import {StringAtom} from './atom/string';
import {BufferAtom} from './atom/buffer';
import {ArrayAtom} from './atom/array';

@singleton
export class Writer {
  private written: Buffer;
  private readonly write: Write;
  private readonly handlers: AnyAtom[];

  constructor() {
    this.write = new Write();
    this.written = Buffer.alloc(0);
    this.handlers = [
      new UInt8(),
      new Int8(),
      new UInt16BE(),
      new Int16BE(),
      new UInt32BE(),
      new Int32BE(),
      new DoubleBE(),
      new NullAtom(),
      new UndefinedAtom(),
      new StringAtom(new UInt32BE(), 'binary'),
      new BufferAtom(new UInt32BE()),
    ];
    this.handlers.push(new ArrayAtom(new UInt32BE(), ...this.handlers));
  }

  private ensure(length: number) {
    if (this.written.length < length) {
      const bigger = Buffer.alloc(Math.max(this.written.length * 2, length));
      this.written.copy(bigger);
      this.written = bigger;
    }
  }

  private applyFixed<T>(value: T, atom: FixedAtom<T>) {
    this.ensure(this.write.offset + atom.width + 1);
    this.write.reset(undefined, this.write.offset, this.written);
    atom.poolWrite(this.write, value);
    if (this.write.err) {
      // handle error
    }
    this.written = this.write.buffer!;
  }

  private applyVariable<T>(value: T, atom: VariableAtom<T>) {
    this.write.reset(undefined, this.write.offset, this.written);
    atom.poolWrite(this.write, value);
    if (this.write.err) {
      // handle error
    }
    this.written = this.write.buffer!;
  }

  private choose(value: unknown): AnyAtom | undefined {
    return this.handlers.filter(handler => handler.isType(value))[0];
  }

  toBuffer(): Buffer {
    return this.written;
  }

  handle(value: unknown): void {
    this.clean();

    for (const handler of this.handlers) {
      if (handler.isType(value)) {
        if (handler instanceof FixedAtom) {
          return this.applyFixed(value, handler);
        }
        return this.applyVariable(value, handler);
      }
    }

    return this.handleObject(value as Record<string, unknown>);
  }

  clean() {
    this.write.reset();
    this.written = Buffer.alloc(0);
  }

  private handleObject(value: {[key in number | string]: unknown}): void {
    const descriptor = [];
    for (const key of Object.keys(value)) {
      const rw = this.choose(value[key]);
      if (!rw) {
        continue;
      }
      descriptor.push({
        name: key.toString(),
        rw,
      });
    }
    const handler = new ObjectAtom(new UInt32BE(), descriptor);
    this.applyVariable(value, handler);
  }
}
