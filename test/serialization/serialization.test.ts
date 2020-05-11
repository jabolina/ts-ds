import {RW} from '../../src/serialization';

type NonRecursiveObject = {
  name: string;
  weight: number;
}

describe('test the object serialization/deserialization', function () {
  it('should serialize a simple uint8', function () {
    const number = 0x7f; // 3
    const buffer = RW.toBuffer(number);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(3);
  });

  it('should serialize an number array', function () {
    const numbers = [
      0x7f, // 3
      0xffff, // 4
      0xffffffff // 6
    ]; // 1 + 4
    const buffer = RW.toBuffer(numbers);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe((1 + 4) + (1 + 1 + 1) + (1 + 1 + 2) + (1 + 1 + 4));
  });

  it('should serialize a string', function () {
    const name = 'jabolina'; // 1 + 4 + ..
    const buffer = RW.toBuffer(name);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThanOrEqual(1 + 4 + name.length);
  });

  it('should serialize a non recursive object', function () {
    const obj: NonRecursiveObject = {
      name: 'jabolina', // 1 + 4 + ..
      weight: 0x7f // 1 + 1 + 1
    }; // 1 + 4
    const buffer = RW.toBuffer(obj);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThanOrEqual((1 + 4) + (1 + 4 + obj.name.length) + (1 + 1 + 1));
  });
});
