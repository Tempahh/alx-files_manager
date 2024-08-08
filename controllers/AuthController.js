import { v4 as uuid4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import UserUtils from '../utils/user';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract the Base64-encoded credentials from the header
    const base64Credentials = authHeader.split(' ')[1];
    // Decode the credentials from Base64 to utf-8
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    // Split the credentials into email and password
    const [email, password] = credentials.split(':');

    // Check if email and password are present
    if (!email || !password) return res.status(401).json({ error: 'Unauthorized' });

    const encryptPasswd = sha1(password);

    const user = await UserUtils.getUser({ email, password: encryptPasswd });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuid4();
    const key = `auth_${token}`;
    const duration = 24;

    redisClient.set(key, user._id.toString(), duration * 3600);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const { userId, key } = await UserUtils.getUserIdAndKey(req);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await redisClient.del(key);

    return res.status(204).send();
  }
}

export default AuthController;
