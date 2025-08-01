// import { OAuth2Client } from 'google-auth-library';

// const client = new OAuth2Client();

// /**
//  * Extract email from Google ID token.
//  * @param {string} token - Google ID token
//  * @returns {Promise<string>} - Email from token payload
//  */
// export const extractEmailFromGoogleToken = async (token) => {
//   const ticket = await client.verifyIdToken({ idToken: token, audience: null });
//   const payload = ticket.getPayload();
//   return payload?.email;
// };


/**
 * Extract email from Google ID token without verification.
 * Works even if the token is expired.
 * @param {string} token - Google ID token
 * @returns {string|null} - Email from token payload
 */
export const extractEmailFromGoogleToken = (token) => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    return payload?.email || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};
