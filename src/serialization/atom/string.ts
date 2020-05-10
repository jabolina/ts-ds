import {NumberAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';

export class StringAtom extends VariableAtom<string> {
  readonly encoding: string;

  constructor(rw: NumberAtom, encoding?: string) {
    super(rw);
    this.encoding = encoding || 'utf8';
  }

  poolWrite(dest: Write, value: string, into: Buffer, offset: number): Write {
    const size = value.length;
    into = this.ensure(offset + this.rw.width + size, into);
    this.rw.poolWrite(dest, size, into, offset);
    if (dest.err) {
      return dest;
    }
    offset = dest.offset;
    const end = offset + size - 1;
    into.write(value, offset, end, this.encoding);
    return dest.reset(undefined, end, into);
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    const res = this.rw.poolRead(dst, from, offset);
    if (res.err) {
      return res;
    }
    const length = res.value;
    const remain = from.length - res.offset;
    if (remain < length) {
      // buffer underflow
    }
    offset = res.offset;
    const end = offset + length;
    const value = from.toString(this.encoding, offset, end);
    return dst.reset(undefined, end, value);
  }

  isType(value: unknown) {
    return typeof value === 'string';
  }
}
