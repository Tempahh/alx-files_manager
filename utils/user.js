import redisClient from './redis';
import dbClient from './db';

/**
 * Modules dedication for user utils
 */

class UserUtils {
  /**
   * Method to query the database and find to get a user
   * @param {Object} query
   * @return {Object} user object
   */
  static async getUser(query) {
    const user = await dbClient.usersCollection.findOne(query);
    return user;
  }

  static async getUserIdAndKey(request) {
    const obj = { userId: null, key: null };

    const xToken = request.header('X-Token');

    // check if token exist
    if (!xToken) return obj;

    obj.key = `auth_${xToken}`;
    obj.userId = await redisClient.get(obj.key);

    return obj;
  }
}

export default UserUtils;
