import Communication from '../../src/communication';
import Message from '../../src/communication/message';

const client = new Communication();
const server = new Communication();

interface TestCustomType {
  value: string;
  key: number;
}

describe('test the communication primitive', function () {
  beforeAll(() => {
    return server.listen()
      .then(() => client.disconnect());
  });

  afterAll(() => {
    return server.disconnect();
  });

  it('should connect into the server successfully', function () {
    return expect(new Promise(resolve => {
      return client.connect()
        .then(connection => {
          resolve(connection.state.isServer());
        });
    })).resolves.toBeFalsy();
  });

  it('should connect and send two messages successfully', function () {
    const message = new Message<string>("plain text", (t: string) => t, (t: string) => t);
    const message2 = new Message<TestCustomType>({
      value: "custom value",
      key: 123,
    }, (t: TestCustomType) => JSON.stringify(t), (t: string) => JSON.parse(t));
    client.on('connectable', session => {
      console.log('connectable available');
    });
    return expect(new Promise(resolve => {
      return client.send(message)
        .then(() => client.send(message2))
        .then(() => {
          console.log('send both');
          process.nextTick(() => {
            resolve(true);
          });
        })
    })).resolves.toBeTruthy()
      .then(() => expect(new Promise(resolve => {
        setTimeout(() => resolve(true), 4000);
      })).resolves.toBeTruthy());
  });
});
