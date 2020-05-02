import Communication from '../../src/communication';

const client = new Communication();
const server = new Communication();

describe('test the communication primitive', function () {
  it('should create a server and then a client should connect', function () {
    return expect(new Promise(resolve => {
      return server.listen()
        .then(connection => {
          resolve(connection.state.isServer());
        });
    })).resolves.toBeTruthy()
      .then(() => expect(new Promise(resolve => {
        return client.connect()
          .then(connection => {
            resolve(connection.state.isServer());
          });
      })).resolves.toBeFalsy());
  });
});
