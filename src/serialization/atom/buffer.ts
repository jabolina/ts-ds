import {VariableAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';

export class BufferAtom extends VariableAtom<Buffer> {
  poolWrite(dest: Write, value: Buffer, into: Buffer, offset: number): Write {
    const size = Buffer.byteLength(value);
    into = this.ensure(offset + this.rw.width + size, into);
    this.rw.poolWrite(dest, size, into, offset);
    if (dest.err) {
      return dest;
    }
    offset = dest.offset;
    const end = offset + size;
    into.fill(value, offset, end);
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
