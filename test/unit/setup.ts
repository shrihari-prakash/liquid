import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

// Setup chai with sinon-chai plugin
chai.use(sinonChai);

// Make chai assertions globally available
(global as any).expect = chai.expect;
(global as any).sinon = sinon;

// Global cleanup to prevent hanging processes
process.on('exit', () => {
  sinon.restore();
});