import {Copyable} from '../util/copyable';

export class Write implements Copyable<Write> {
  err: Error | undefined;
  offset: number;
  buffer?: Buffer;

  constructor(err?: Error, offset?: number) {
    this.err = err;
    this.offset = offset || 0;
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
    return this;
  }

  static fail(err: Error, offset: number): Write {
    return new Write(err, offset);
  }

  static skip(offset: number): Write {
    return new Write(undefined, offset);
  }
}