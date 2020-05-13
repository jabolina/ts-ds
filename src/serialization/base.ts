import {Write} from './write';
import {Read} from './read';
import {AtomCode} from './atom';

export class Serializer<T> {
  readonly code: AtomCode;

  constructor(code: AtomCode) {
    this.code = code;
  }

  ensure(size: number, buffer: Buffer): Buffer {
    if (buffer.length < size) {
      const bigger = Buffer.alloc(size);
      buffer.copy(bigger);
      buffer = bigger;
    }
    return buffer;
  }

  write(value: T, into: Buffer, offset: number): Write {
    const write = new Write();
    into = this.ensure(offset + 1, into);
    into.writeUInt8(this.code, offset, true);
    return write.reset(undefined, offset + 1, into);
  }

  poolWrite(dest: Write, value: T): Write {
    if (!dest.buffer) {
      return dest.reset(new Error('TODO: buffer not found error'));
    }
    const write = this.write(value, dest.buffer, dest.offset);
    return dest.copy(write);
  }

  read(from: Buffer, offset: number, value?: T): Read {
    const read = new Read(undefined, offset, undefined);
    return this.poolRead(read, from);
  }

  poolRead(dest: Read, from: Buffer): Read {
    const src = this.read(from, dest.offset, dest.value);
    return dest.copy(src);
  }
}

export class VariableSerializer<T> extends Serializer<T> {
  readonly rw: FixedAtom<number>;

  constructor(code: AtomCode, rw: FixedAtom<number>) {
    super(code);
    this.rw = rw;
  }
}

export type AnyAtom = FixedAtom<unknown> | VariableAtom<unknown>;

export class Atom<T> extends Serializer<T> {}

export class FixedAtom<T> extends Atom<T> {
  readonly width: number;

  constructor(code: AtomCode, width: number) {
    super(code);
    this.width = width;
  }

  poolRead(dest: Read, from: Buffer): Read {
    const remaining = from.length - dest.offset;
    if (remaining < this.width) {
      return dest.fail(new Error('TODO: remaining less than number width'));
    }
    return this.readAtom(from, dest);
  }

  poolWrite(dest: Write, value: T): Write {
    if (!dest.buffer) {
      return dest.reset(new Error('TODO: buffer not found error'));
    }
    dest.copy(super.poolWrite(dest, value));
    if (dest.err) {
      return dest;
    }
    dest.buffer = this.ensure(dest.offset + this.width, dest.buffer);
    const remaining = dest.buffer.length - dest.offset;
    if (remaining < this.width) {
      return dest.fail(new Error('TODO: buffer underflow'));
    }
    return this.writeAtom(dest, dest.buffer, dest.offset, value);
  }

  readAtom(from: Buffer, into: Read): Read {
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
  readonly rws: AnyAtom[];

  constructor(code: AtomCode, rw: FixedAtom<number>, ...rws: AnyAtom[]) {
    super(code, rw);
    this.rws = rws || [];
    this.rws.push(this);
  }

  select(code: number) {
    for (const rw of this.rws) {
      if (rw.code === code) {
        return rw;
      }
    }
    return undefined;
  }

  isType(value: unknown) {
    throw new Error('`isType` Method not overridden');
  }
}

export class NumberAtom extends FixedAtom<number> {
  min: number;
  max: number;

  constructor(code: AtomCode, width: number, min: number, max: number) {
    super(code, width);
    this.max = max;
    this.min = min;
  }

  poolWrite(dest: Write, value: number): Write {
    if (!dest.buffer) {
      return dest.fail(new Error('TODO: buffer not found error'));
    }

    if (value < this.min || value > this.max) {
      return dest.fail(new Error('TODO: range not valid error'));
    }

    return super.poolWrite(dest, value);
  }

  isType(value: unknown): boolean {
    if (typeof value === 'number' && Number.isInteger(value)) {
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

  constructor(code: AtomCode, width: number, fill?: number) {
    super(code, width);
    this.fill = fill || 0;
  }

  poolWrite(dest: Write, value: number): Write {
    if (!dest.buffer) {
      return dest.fail(new Error('TODO: buffer not found error'));
    }
    dest.copy(super.poolWrite(dest, value));
    const end = dest.offset + this.width;
    dest.buffer.fill(this.fill, dest.offset, end);
    return dest.reset(undefined, end, dest.buffer);
  }

  poolRead(dst: Read, from: Buffer): Read {
    const end = dst.offset + this.width;
    if (end > from.length) {
      // buffer overflow
    }
    return dst.reset(undefined, end, undefined);
  }
}
