import redis from 'redis';
import { promisify } from 'util';

/* class for perfoming redis operatoin */

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.client.on('connect', () => {
      // console.log('Redis client connected');
    });

    this.client.on('error', (err) => {
      console.log('Redis client not connected to the server: ', err);
    });
  }

  /**
   * Method that check if connection is alive
   * @return {boolean} true if the connection is alive or false if not
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Method that get the value of a key
   * @param {string} key to get
   * @param {string} value of the key
   */

  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * Method that set a key value pair
   * @param {string} key to set
   * @param {string} value to set
   * @param {number} duratin in seconds
   * @return {void}
   */
  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  /**
   * Method that delete a key
   * @param {string} key to delete
   * @return {void}
   */
  async del(key) {
    return this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
