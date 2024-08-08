import { ObjectId } from 'mongodb';
import { v4 as uuid4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import basicUtils from './basic';

const fileUtils = {
  /**
   * Validates if body is valid for creating file
   * @param {object} request - Express request object
   * @return {object} - Object with error and validated params
   */
  async validateBody(request) {
    const {
      name, type, isPublic = false, data,
    } = request.body;

    // Extract parentId from the request.body
    const { parentId = 0 } = request.body;

    const typesAllowed = ['file', 'image', 'folder'];
    let msg = null;

    if (!name) {
      msg = 'Missing name';
    } else if (!type || !typesAllowed.includes(type)) {
      msg = 'Missing type';
    } else if (!data && type !== 'folder') {
      msg = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file;

      if (basicUtils.isValidId(parentId)) {
        file = await dbClient.filesCollection.findOne(
          { _id: ObjectId(parentId) },
        );
      } else {
        file = null;
      }

      if (!file) {
        msg = 'Parent not found';
      } else if (file.type !== 'folder') {
        msg = 'Parent is not a folder';
      }
    }

    const obj = {
      error: msg,
      fileParams: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };

    return obj;
  },

  /**
   * Saves files to database and disk
   * @param {string} userId - ID of the user
   * @param {object} fileParams - Object with attributes of file to save
   * @param {string} FOLDER_PATH - Path to save file in the disk
   * @return {object} - Object with error if present and file
   */
  async saveFile(userId, fileParams, FOLDER_PATH) {
    const {
      name, type, isPublic, data,
    } = fileParams;
    let { parentId } = fileParams;

    if (parentId !== 0) parentId = ObjectId(parentId);

    const query = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (fileParams.type !== 'folder') {
      const fileNameUUID = uuid4();

      const fileDataDecoded = Buffer.from(data, 'base64');

      const path = `${FOLDER_PATH}/${fileNameUUID}`;
      query.localPath = path;

      try {
        await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
        await fsPromises.writeFile(path, fileDataDecoded);
      } catch (err) {
        return { error: err.message, code: 400 };
      }
    }

    const result = await dbClient.filesCollection.insertOne(query);
    const file = this.processFile(query);
    const newFile = { id: result.insertedId, ...file };

    return { error: null, newFile };
  },

  /**
   * Process the file and remove the path
   * Transform _id into id in a file document
   * @param {object} doc - Document to be processed
   * @return {object} - Processed document
   */
  processFile(doc) {
    const file = { id: doc._id, ...doc };

    delete file.localPath;
    delete file._id;

    return file;
  },

  /**
   * Get file document if userid is linked
   * @param {Object} query - query object
   * @return file document
   */
  async getFile(query) {
    const file = await dbClient.filesCollection.findOne(query);
    return file;
  },

  /**
   * Updates a file document in database
   * @query {obj} query to find document to update
   * @set {obj} object wth query info to update in Mongo
   * @return {object} updated file
   */
  async updateFile(query, set) {
    const fileList = await dbClient.filesCollection.findOneAndUpdate(
      query,
      set,
      { returnOriginal: false },
    );
    return fileList;
  },

  /**
   * Method to get file data
   * @file file document
   * @size size to append to file
   * @return data
   */
  async fileData(file, size) {
    let { localPath } = file;
    let data;

    if (size) localPath = `${localPath}_${size}`;

    try {
      data = await fsPromises.readFile(localPath);
    } catch (error) {
      return { error: 'Not found', code: 404 };
    }

    return { data };
  },
};

export default fileUtils;
