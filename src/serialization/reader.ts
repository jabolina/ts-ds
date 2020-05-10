import {Read} from './read';

export class Reader {
  private readonly buffer: Buffer;
  private readonly read: Read;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.read = new Read();
  }
  /*
    private _apply<T>(atom: Atom<T>): T {
      atom.readAtom(this.buffer, this.read, this.read.offset);
      if (this.read.err) {
        // handle errors
      }
      return this.read.value;
    }

    private _applyVariable<T>(atom: VariableAtom<T>): T {
      atom.poolRead(this.read, this.buffer, this.read.offset);
      if (this.read.err) {
        // handle errors
      }
      return this.read.value;
    }

    double(): number {
      return this._apply(new DoubleBE());
    }

    float(): number {
      return this._apply(new FloatBE());
    }

    uint8(): number {
      return this._apply(new UInt8());
    }

    int8(): number {
      return this._apply(new Int8());
    }

    uint16be(): number {
      return this._apply(new UInt16BE());
    }

    int16be(): number {
      return this._apply(new Int16BE());
    }

    uint32be(): number {
      return this._apply(new UInt32BE());
    }

    int32be(): number {
      return this._apply(new Int32BE());
    }

    string(): string {
      return this._applyVariable(new StringAtom(new UInt32BE(), 'binary'));
    }
  */
  peek(): number {
    const value = this.buffer[this.read.offset];
    if (value === undefined) {
      throw new Error('TODO: handle error');
    }
    return value;
  }

  size(): number {
    const next = this.peek();
    if (!(next & 0x80)) {
      // return this.uint8();
    }

    if (!(next & 0x40)) {
      // return this.uint16be() & 0x3fff;
    }

    if (!(next & 0x20)) {
      // return this.uint32be() & 0x1fffffff;
    }
    throw new Error('TODO: handle error');
  }

  skip() {
    this.read.offset += 1;
  }
}
