import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

// Set NODE_ENV to test for silent logging
process.env.NODE_ENV = 'test';

// Setup chai with sinon integration
chai.use(sinonChai);
(global as any).expect = chai.expect;
(global as any).sinon = sinon;

// Simple cleanup
process.on('exit', () => {
  sinon.restore();
});
