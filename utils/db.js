import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

/* class for performing mongo operation */
class DBClient {
  constructor() {
    // connect to mogodb database
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(DB_DATABASE);
        this.usersCollection = this.db.collection('users');
        this.filesCollection = this.db.collection('files');
      })
      .catch((err) => {
        console.error(err.message);
        this.db = false;
      });
  }

  /**
   * Method that check if connection is alive
   * @return {boolean} true if the connection is alve or false if not
   */
  isAlive() {
    return Boolean(this.db);
  }

  /**
   * Method that get the collection
   * @return {Number} return number of document
   * in the collection user
   */
  async nbUsers() {
    return this.usersCollection.countDocuments();
  }

  /**
   * Method that get the files collections
   * @return {Number} return number of document in
   * the collection files
   */
  async nbFiles() {
    return this.filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
