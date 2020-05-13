import {Copyable} from '../util/copyable';

export class Read implements Copyable<Read> {
  err: Error | undefined;
  offset: number;
  value: any | undefined;

  constructor(err?: Error, offset?: number, value?: any) {
    this.err = err;
    this.offset = offset || 0;
    this.value = value;
  }

  copy(from: Read): Read {
    return this;
  }

  reset(err?: Error, offset?: number, value?: any): Read {
    this.err = err;
    this.offset = offset || 0;
    this.value = value;
    return this;
  }

  fail(err: Error, offset?: number, value?: any): Read {
    this.err = err;
    this.offset = offset || this.offset;
    this.value = value;
    return this;
  }

  static skip(offset: number, value?: any): Read {
    return new Read(undefined, offset, value);
  }
}
