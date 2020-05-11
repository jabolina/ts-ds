import {FixedAtom, VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';
import {AtomCode} from './index';

export class BufferAtom extends VariableAtom<Buffer> {
  constructor(rw: FixedAtom<number>) {
    super(AtomCode.BufferCode, rw);
  }

  poolWrite(dest: Write, value: Buffer): Write {
    if (!dest.buffer) {
      return dest.reset(new Error('TODO: buffer not found error'));
    }
    dest.copy(super.poolWrite(dest, value));
    const size = Buffer.byteLength(value);
    dest.buffer = this.ensure(dest.offset + this.rw.width + size, dest.buffer);
    this.rw.poolWrite(dest, size);
    if (dest.err) {
      return dest;
    }
    const end = dest.offset + size;
    dest.buffer.fill(value, dest.offset, end);
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
      // content broken
    }
    offset = res.offset;
    const end = offset + length;
    const value = from.slice(offset, end);
    return dst.reset(undefined, end, value);
  }

  isType(value: unknown) {
    return Buffer.isBuffer(value);
  }
}
