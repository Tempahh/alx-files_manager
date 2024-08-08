import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Method that get database status
   * @param {*} req
   * @param {*} res
   * @returns {Object}
  */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    res.status(200).send(status);
  }

  /**
   * Method that get the number of users and files
   * @param {*} req
   * @param {*} res
   * @param {Object}
   */

  static async getStat(req, res) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    res.status(200).send(stats);
  }
}

export default AppController;
