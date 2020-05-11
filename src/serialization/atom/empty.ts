import {EmptyAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';
import {AtomCode} from './index';

export class NullAtom extends EmptyAtom {
  constructor() {
    super(AtomCode.NullCode, 0);
  }

  poolWrite(dest: Write, value: number): Write {
    const placeholder = super.poolWrite(dest, value);
    if (placeholder.err) {
      return dest.copy(placeholder);
    }
    return dest.reset(
      undefined,
      placeholder.offset + this.width,
      placeholder.buffer!
    );
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    return dst.reset(undefined, offset + this.width, null);
  }

  isType(value: unknown): boolean {
    return typeof value === 'object' && value === null;
  }
}

export class UndefinedAtom extends EmptyAtom {
  constructor() {
    super(AtomCode.UndefinedCode, 0);
  }

  poolWrite(dest: Write, value: number): Write {
    const placeholder = super.poolWrite(dest, value);
    if (placeholder.err) {
      return dest.copy(placeholder);
    }
    return dest.reset(
      undefined,
      placeholder.offset + this.width,
      placeholder.buffer!
    );
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    return dst.reset(undefined, offset + this.width, undefined);
  }

  isType(value: unknown): boolean {
    return typeof value === 'undefined';
  }
}
