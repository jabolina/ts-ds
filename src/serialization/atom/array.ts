import {AnyAtom, FixedAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';

export class ArrayAtom<T extends Array<unknown>> extends VariableAtom<T> {
  readonly rws: AnyAtom[];

  constructor(rw: FixedAtom<number>, ...rws: AnyAtom[]) {
    super(rw);
    this.rws = rws;
    this.rws.push(this);
  }

  private which(value: unknown) {
    for (const rw of this.rws) {
      if (rw.isType(value)) {
        return rw;
      }
    }
    return undefined;
  }

  poolWrite(dest: Write, value: T, into: Buffer, offset: number): Write {
    for (const val of value) {
      const rw = this.which(val);
      if (rw) {
        if (rw instanceof FixedAtom) {
          into = this.ensure(offset + rw.width + 1, into);
        }

        rw.poolWrite(dest, val, into, offset);
        if (dest.err) {
          return dest;
        }
      }
      offset = dest.offset;
    }
    return dest.reset(undefined, offset, into);
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    const values = [];
    const placeholder = new Read();
    for (let idx = 0; idx < this.rws.length; idx += 1) {
      this.rws[idx].poolRead(placeholder, from, offset);
      if (placeholder.err) {
        return dst.copy(placeholder);
      }
      offset = placeholder.offset;
      values.push(placeholder.value);
    }
    placeholder.value = values;
    return dst.reset(undefined, offset, placeholder.value);
  }

  isType(value: unknown) {
    return Array.isArray(value);
  }
}
