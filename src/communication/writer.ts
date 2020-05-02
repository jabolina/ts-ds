export default class Writer {
  private buffer: Buffer;
  position: number;

  constructor(buffer?: Buffer) {
    this.buffer = buffer || Buffer.alloc(1024);
    this.position = 0;
  }

  ensure(length: number) {
    if (this.buffer.length < length) {
      const bigger = Buffer.alloc(Math.max(this.buffer.length * 2, length));
      this.buffer.copy(bigger);
      this.buffer = bigger;
    }
  }

  skip(bytes: number) {
    this.ensure(this.position + bytes);
    this.position += bytes;
  }

  fill(width: number, saved: number) {
    const gap = this.position - saved;
    this.position = saved;
    this.wunit(gap - width, width);
    this.position += gap - width;
  }

  remaining() {
    return this.buffer.length - this.position;
  }

  flush() {
    this.buffer.fill(0x00);
    this.position = 0;
  }

  wunit(value: number, width: number): number {
    const current = this.position;
    this.ensure(this.position + width);
    this.position += width;
    if (width === 1) {
      return this.buffer.writeUInt8(value, current);
    }

    if (width === 2) {
      return this.buffer.writeUInt16BE(value, current);
    }

    if (width === 4) {
      return this.buffer.writeUInt32BE(value, current);
    }

    throw new Error(`Unexpect UInt width ${width}`);
  }

  wbytes(source: Buffer): void {
    const current = this.position;
    this.ensure(this.position + source.length);
    this.position += source.length;
    source.copy(this.buffer, current);
  }

  toBuffer(): Buffer {
    return this.buffer.slice(0, this.position);
  }
}
