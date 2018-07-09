const assert = require('assert');

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});

describe('Object', function () {
    describe('#key()', function () {
        it('should return keys of object', function () {
            assert.equal(Object.keys({1: 0, 2: 0, 3: 0}).join(), [1, 2, 3].join());
        });
    });
});