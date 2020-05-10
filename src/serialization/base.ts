import {Write} from './write';
import {Read} from './read';

export class Serializer<T> {
  write(value: T, into: Buffer, offset: number): Write {
    const write = new Write();
    return this.poolWrite(write, value, into, offset);
  }

  poolWrite(dest: Write, value: T, into: Buffer, offset: number): Write {
    const write = this.write(value, into, offset);
    return dest.copy(write);
  }

  read(from: Buffer, offset: number, value?: T): Read {
    const read = new Read();
    return this.poolRead(read, from, offset, value);
  }

  poolRead(dst: Read, from: Buffer, offset: number, value?: T): Read {
    const src = this.read(from, offset, value);
    return dst.copy(src);
  }
}

export class VariableSerializer<T> extends Serializer<T> {
  readonly rw: FixedAtom<number>;

  constructor(rw: FixedAtom<number>, lazy?: boolean) {
    super();
    this.rw = rw;
    if (lazy) {
      this.poolRead = (dst: Read, from: Buffer, offset: number): Read => {
        this.rw.poolRead(dst, from, offset);
        if (dst.err) {
          return dst;
        }

        const length = dst.value;
        const remain = from.length - dst.offset;
        if (remain < length) {
          // buffer overflow
        }

        offset = dst.offset;
        const end = offset + length;
        const buf = from.slice(offset, end);
        return dst.reset(undefined, end, buf);
      };
    } else {
      this.poolRead = (dst: Read, from: Buffer, offset: number): Read => {
        this.rw.poolRead(dst, from, offset);
        if (dst.err) {
          return dst;
        }

        const length = dst.value;
        const remain = from.length - dst.offset;
        if (remain < length) {
          // buffer overflow
        }

        offset = dst.offset;
        const end = offset + length;
        const buf = from.slice(offset, end);
        return dst.reset(undefined, end, buf);
      };
    }
  }

  poolWrite(dest: Write, value: T, into: Buffer, offset: number): Write {
    const start = offset + this.rw.width;
    let length = 0;
    if (Buffer.isBuffer(value)) {
      length = value.copy(into, start);
    } else if (value === null || value === undefined) {
      length = 0;
    } else {
      // cannot handle value
    }

    this.rw.poolWrite(dest, length, into, offset);
    if (dest.err) {
      return dest;
    }
    return dest.reset(undefined, start + length);
  }
}

export type AnyAtom = FixedAtom<unknown> | VariableAtom<unknown>;

export class Atom<T> extends Serializer<T> {}

export class FixedAtom<T> extends Atom<T> {
  readonly width: number;

  constructor(width: number) {
    super();
    this.width = width;
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    const remaining = from.length - offset;
    if (remaining < this.width) {
      // buffer underflow
    }
    return this.readAtom(from, dst, offset);
  }

  poolWrite(dest: Write, value: T, into: Buffer, offset: number): Write {
    into.writeUInt8(this.width, offset, true);
    offset += 1;
    const remaining = into.length - offset;
    if (remaining < this.width) {
      // buffer underflow
    }
    return this.writeAtom(dest, into, offset, value);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    throw new Error('`readAtom` Method not overridden');
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: T): Write {
    throw new Error('`writeAtom` Method not overridden');
  }

  isType(value: unknown): boolean {
    throw new Error('`isType` Method not overridden');
  }
}

export class VariableAtom<T> extends VariableSerializer<T> {
  constructor(rw: FixedAtom<number>) {
    super(rw);
  }

  ensure(size: number, buffer: Buffer): Buffer {
    if (buffer.length < size) {
      const bigger = Buffer.alloc(Math.max(buffer.length * 2, size));
      buffer.copy(bigger);
      buffer = bigger;
    }
    return buffer;
  }

  isType(value: unknown) {
    throw new Error('`isType` Method not overridden');
  }
}

export class NumberAtom extends FixedAtom<number> {
  min: number;
  max: number;

  constructor(width: number, min: number, max: number) {
    super(width);
    this.max = max;
    this.min = min;
  }

  poolWrite(dest: Write, value: number, into: Buffer, offset: number): Write {
    if (value < this.min || value > this.max) {
      // range error
    }
    return super.poolWrite(dest, value, into, offset);
  }

  isType(value: unknown): boolean {
    if (typeof value === 'number') {
      const parsed = value as number;
      return parsed >= this.min && parsed <= this.max;
    }
    return false;
  }
}

export class FloatingNumber extends FixedAtom<number> {
  isType(value: unknown): boolean {
    if (typeof value === 'number') {
      return !Number.isInteger(value);
    }
    return false;
  }
}

export class EmptyAtom extends FixedAtom<number> {
  readonly fill: number;

  constructor(width: number, fill?: number) {
    super(width);
    this.fill = fill || 0;
  }

  poolWrite(dest: Write, value: number, into: Buffer, offset: number): Write {
    const end = offset + this.width;
    into.fill(this.fill, offset, end);
    return dest.reset(undefined, end);
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    const end = offset + this.width;
    if (end > from.length) {
      // buffer overflow
    }
    return dst.reset(undefined, end, undefined);
  }
}
