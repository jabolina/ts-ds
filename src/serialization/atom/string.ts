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
    if (dest.err) {
      return dest;
    }

    const size = value.length;
    dest.buffer = this.ensure(dest.offset + this.rw.width, dest.buffer);
    dest.copy(this.rw.poolWrite(dest, size));
    if (dest.err) {
      return dest;
    }
    dest.buffer = this.ensure(dest.offset + size, dest.buffer);
    const end = dest.offset + size;
    dest.buffer.write(value, dest.offset, end, this.encoding);
    return dest.reset(undefined, end, dest.buffer);
  }

  poolRead(dst: Read, from: Buffer): Read {
    const code = from.readUInt8(dst.offset, true);
    if (code !== this.rw.code) {
      return dst.fail(new Error('TODO: code is not from variable rw'));
    }
    dst.offset += 1;
    dst.copy(this.rw.poolRead(dst, from));
    if (dst.err) {
      return dst;
    }
    const length = dst.value;
    const remain = from.length - dst.offset;
    if (remain < length) {
      // buffer underflow
    }

    const end = dst.offset + length;
    const value = from.toString(this.encoding, dst.offset, end);
    return dst.reset(undefined, end, value);
  }

  isType(value: unknown) {
    return typeof value === 'string';
  }
}
