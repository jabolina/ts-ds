export default class Reader {
  buffer: Buffer;
  position: number;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.position = 0;
  }

  ruint(width: number): number {
    const current = this.position;
    this.position += width;
    if (width === 1) {
      return this.buffer.readUInt8(current);
    }

    if (width === 2) {
      return this.buffer.readUInt16BE(current);
    }

    if (width === 4) {
      return this.buffer.readUInt32BE(current);
    }

    throw new Error(`Unexpected width ${width} while reading uint`);
  }

  rbytes(width: number): Buffer {
    const current = this.position;
    this.position += width;
    return this.buffer.slice(current, this.position);
  }

  skip(width: number): void {
    this.position += width;
  }

  remaining(): number {
    return this.buffer.length - this.position;
  }

  drain(): Buffer {
    const current = this.position;
    this.position = this.buffer.length;
    return this.buffer.slice(current, this.position);
  }
}
