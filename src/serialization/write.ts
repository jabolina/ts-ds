import {Copyable} from '../util/copyable';

export class Write implements Copyable<Write> {
  err: Error | undefined;
  offset: number;
  buffer?: Buffer;

  constructor(err?: Error, offset?: number, buffer?: Buffer) {
    this.err = err;
    this.offset = offset || 0;
    this.buffer = buffer;
  }

  reset(err?: Error, offset?: number, buffer?: Buffer): Write {
    this.err = err;
    this.offset = offset || 0;
    this.buffer = buffer;
    return this;
  }

  copy(from: Write): Write {
    this.err = from.err;
    this.offset = from.offset;
    this.buffer = from.buffer;
    return this;
  }

  fail(err: Error): Write {
    this.err = err;
    return this;
  }

  static skip(offset: number): Write {
    return new Write(undefined, offset);
  }
}
