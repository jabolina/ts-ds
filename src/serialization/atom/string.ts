import {NumberAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';
import {AtomCode} from './index';

export class StringAtom extends VariableAtom<string> {
  readonly encoding: string;

  constructor(rw: NumberAtom, encoding?: string) {
    super(AtomCode.StringCode, rw);
    this.encoding = encoding || 'utf8';
  }

  poolWrite(dest: Write, value: string): Write {
    if (!dest.buffer) {
      return dest.reset(new Error('TODO: buffer not found error'));
    }
    dest.copy(super.poolWrite(dest, value));
    const size = value.length;
    dest.buffer = this.ensure(dest.offset + this.rw.width, dest.buffer);
    dest.copy(this.rw.poolWrite(dest, size));
    if (dest.err) {
      return dest;
    }
    dest.buffer = this.ensure(dest.offset + size, dest.buffer);
    const end = dest.offset + size - 1;
    dest.buffer.write(value, dest.offset, end, this.encoding);
    return dest.reset(undefined, end, dest.buffer);
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
