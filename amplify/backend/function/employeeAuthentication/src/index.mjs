// index.mjs
import { generateToken, verifyToken } from './auth.mjs';

const email = 'ujjwal@navgurukul.org';

// Generate a token
const token = generateToken(email);
console.log('Generated Token:', token);

// Verify the token
const result = verifyToken(token);
console.log('Verification:', result);
