import {EmptyAtom} from '../base';
import {Write} from '../write';
import {Read} from '../read';

export class NullAtom extends EmptyAtom {
  constructor() {
    super(0);
  }

  poolWrite(dest: Write, value: number, into: Buffer, offset: number): Write {
    return dest.reset(undefined, offset + this.width, into);
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
    super(0);
  }

  poolWrite(dest: Write, value: number, into: Buffer, offset: number): Write {
    return dest.reset(undefined, offset + this.width, into);
  }

  poolRead(dst: Read, from: Buffer, offset: number): Read {
    return dst.reset(undefined, offset + this.width, undefined);
  }

  isType(value: unknown): boolean {
    return typeof value === 'undefined';
  }
}
