const { EC } = require('elliptic');
const secp256k1 = require('secp256k1');
const EC = new EC('secp256k1');

// Function to generate a Bulletproof
function generateBulletproof(value, range) {
    const proof = {
        value,
        range,
        commitment: EC.genKeyPair().getPublic().encode('hex')
    };
    return proof;
}

// Example usage
const value = 42;
const range = [0, 100];
const proof = generateBulletproof(value, range);
console.log("Proof generated:", proof);
