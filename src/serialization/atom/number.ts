import {Write} from '../write';
import {Read} from '../read';
import {FloatingNumber, NumberAtom} from '../base';

export class UInt8 extends NumberAtom {
  constructor() {
    super(1, 0, 0xff);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readUInt8(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeUInt8(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class Int8 extends NumberAtom {
  constructor() {
    super(1, -0x80, 0x7f);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readInt8(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeInt8(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class UInt16BE extends NumberAtom {
  constructor() {
    super(2, 0, 0xffff);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readUInt16BE(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeUInt16BE(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class Int16BE extends NumberAtom {
  constructor() {
    super(2, -0x8000, 0x7fff);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readInt16BE(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeInt16BE(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class UInt32BE extends NumberAtom {
  constructor() {
    super(4, 0, 0xffffffff);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readUInt32BE(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeUInt32BE(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class Int32BE extends NumberAtom {
  constructor() {
    super(4, 0x80000000, 0x7fffffff);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readInt32BE(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeInt32BE(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class FloatBE extends FloatingNumber {
  constructor() {
    super(4);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readFloatBE(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeFloatBE(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}

export class DoubleBE extends FloatingNumber {
  constructor() {
    super(8);
  }

  readAtom(from: Buffer, into: Read, offset: number): Read {
    const value = from.readDoubleBE(offset, true);
    return into.reset(undefined, offset + this.width, value);
  }

  writeAtom(result: Write, into: Buffer, offset: number, value: number): Write {
    into.writeDoubleBE(value, offset, true);
    return result.reset(undefined, offset + this.width, into);
  }
}
