import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

/**
 * Extract email from Google ID token.
 * @param {string} token - Google ID token
 * @returns {Promise<string>} - Email from token payload
 */
export const extractEmailFromGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({ idToken: token, audience: null });
  const payload = ticket.getPayload();
  return payload?.email;
};
