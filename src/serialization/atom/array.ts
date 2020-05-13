import {AnyAtom, FixedAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';
import {AtomCode} from './index';

export class ArrayAtom<T extends Array<unknown>> extends VariableAtom<T> {
  constructor(rw: FixedAtom<number>, ...rws: AnyAtom[]) {
    super(AtomCode.ArrayCode, rw, ...rws);
  }

  private which(value: unknown) {
    for (const rw of this.rws) {
      if (rw.isType(value)) {
        return rw;
      }
    }
    return undefined;
  }

  poolWrite(dest: Write, value: T): Write {
    if (!dest.buffer) {
      return dest.reset(new Error('TODO: buffer not found error'));
    }
    dest.copy(super.poolWrite(dest, value));
    for (const val of value) {
      const rw = this.which(val);
      if (rw) {
        if (rw instanceof FixedAtom) {
          dest.buffer = this.ensure(dest.offset + rw.width, dest.buffer);
        }

        dest.copy(rw.poolWrite(dest, val));
        if (dest.err) {
          return dest;
        }
      }
    }

    return dest;
  }

  poolRead(dst: Read, from: Buffer): Read {
    const values = [];

    while (dst.offset < from.length) {
      const code = from.readUInt8(dst.offset, true);
      dst.offset += 1;
      const rw = this.select(code);

      if (rw) {
        dst.copy(rw.poolRead(dst, from));
      } else if (code === this.code) {
        dst.copy(this.poolRead(dst, from));
      } else {
        return dst.fail(new Error('TODO: deserializer not found'));
      }

      if (dst.err) {
        return dst;
      }
      values.push(dst.value);
    }

    return dst.reset(undefined, dst.offset, values);
  }

  isType(value: unknown) {
    return Array.isArray(value);
  }
}
