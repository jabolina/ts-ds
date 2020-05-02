import Communication from '../../src/communication';
import Connection from '../../src/communication/connection';

const communication = new Communication();

describe('test the communication primitive', function () {
  it('should connect successfully', function () {
    return expect(new Promise(resolve => {
      return communication.connect()
        .then((connect: Connection) => {
          expect(connect.writer).toBeDefined();
          connect.writer!.write(Buffer.from('hello'));
          connect.writer!.pipe(connect.writer!);
          setTimeout(() => resolve(true), 3500);
        });
    })).resolves.toBeTruthy();
  });
});
