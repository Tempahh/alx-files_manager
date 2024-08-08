import { ObjectId } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import UserUtils from '../utils/user';
import fileUtils from '../utils/file';
import basicUtils from '../utils/basic';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const fileQueue = new Queue('FileQueue');

class FilesController {
  static async postUpload(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) return res.status(401).send({ error: 'Unauthorized' });

    if (!userId && req.body.type === 'image') {
      await fileQueue.add({});
    }

    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { error: ValidationError, fileParams } = await fileUtils.validateBody(req);
    if (ValidationError) return res.status(400).send({ error: ValidationError });

    if (fileParams.parentId !== 0 && !basicUtils.isValidId(fileParams.parentId)) {
      return res.status(400).send({ error: 'Parent not found' });
    }

    const { error, code, newFile } = await fileUtils.saveFile(userId, fileParams, FOLDER_PATH);

    if (error) {
      if (res.body.type === 'image') await fileQueue.add({ userId });
      return res.status(code).send(error);
    }

    if (fileParams.type === 'image') {
      await fileQueue.add({
        fileId: newFile.id.toString(),
        userId: newFile.userId.toString(),
      });
    }

    return res.status(201).send(newFile);
  }

  /**
   * getShow retrieve files based on the token
   * @param {*} req - request
   * @param {*} res - response
   * @returns file document is linked to the user and the Id passed
   * as parameter, otherwise return an error Not found.
   */
  static async getShow(req, res) {
    const { id: fileId } = req.params;
    const { userId } = await UserUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) return res.status(401).send({ error: 'Unauthorized' });

    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    // Check for id
    if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) return res.status(404).send({ error: 'Not found' });

    const result = await fileUtils.getFile({ _id: ObjectId(fileId), userId: ObjectId(userId) });
    if (!result) return res.status(404).send({ error: 'Not Found' });

    const file = await fileUtils.processFile(result);

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) return res.status(401).send({ error: 'Unauthorized' });

    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    let parentId = req.query.parentId || '0';

    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;

    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!basicUtils.isValidId(parentId)) return res.status(401).send({ error: 'Unauthorized' });

      parentId = ObjectId(parentId);

      const folder = await fileUtils.getFile({ _id: ObjectId(parentId) });

      if (!folder || folder.type !== 'folder') return res.status(200).send([]);
    }

    const paginationPipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      { $limit: 20 },
    ];

    const aggregate = await dbClient.filesCollection.aggregate(paginationPipeline);

    const fileList = [];
    await aggregate.forEach((doc) => {
      const document = fileUtils.processFile(doc);
      fileList.push(document);
    });

    return res.status(200).send(fileList);
  }

  /**
   * publish file that set isPublic to true on the file
   * document based on the ID
   * @param {*} req - request
   * @param {*} res - respond
   * @return the file document with a status code 200
   */
  static async putPublish(req, res) {
    const { id: fileId } = req.params;
    const { userId } = await UserUtils.getUserIdAndKey(req);

    // Validate userId
    if (!basicUtils.isValidId(userId)) return res.status(401).send({ error: 'Unauthorized' });

    // Retrieve user
    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    // Validate fileId
    if (!basicUtils.isValidId(fileId)) return res.status(404).send({ error: 'Not found' });

    // Retrieve file document
    const fileDocument = await fileUtils.getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    // Check if file document exists
    if (!fileDocument) return res.status(404).send({ error: 'Not Found' });

    // Update the isPublic field
    const result = await fileUtils.updateFile(
      {
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      },
      { $set: { isPublic: true } },
    );

    const {
      _id: id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    } = result.value;

    // Process the updated file document
    const updatedFile = {
      id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    };

    // Return the updated file document
    return res.status(200).send(updatedFile);
  }

  /**
   * unpublish file that set isPublic to false on the file
   * document based on the ID
   * @param {*} req - request
   * @param {*} res - respond
   * @return the file document with a status code 200
   */
  static async putUnpublish(req, res) {
    const { id: fileId } = req.params;
    const { userId } = await UserUtils.getUserIdAndKey(req);

    // Validate userId
    if (!basicUtils.isValidId(userId)) return res.status(401).send({ error: 'Unauthorized' });

    // Retrieve user
    const user = await UserUtils.getUser({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    // Validate fileId
    if (!basicUtils.isValidId(fileId)) return res.status(404).send({ error: 'Not found' });

    // Retrieve file document
    const fileDocument = await fileUtils.getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    // Check if file document exists
    if (!fileDocument) return res.status(404).send({ error: 'Not Found' });

    // Update the isPublic field
    const result = await fileUtils.updateFile(
      {
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      },
      { $set: { isPublic: false } },
    );

    const {
      _id: id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    } = result.value;

    // Process the updated file document
    const updatedFile = {
      id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    };

    // Return the updated file document
    return res.status(200).send(updatedFile);
  }

  /**
   * grtfile should return the content of the file
   * document based on the id
   * @param {*} req - request
   * @param {*} res - respond
   * @return the content of the file document
   */
  static async getFile(req, res) {
    const { userId } = await UserUtils.getUserIdAndKey(req);
    const { id: fileId } = req.params;
    const size = req.query.size || 0;

    // validate fileId
    if (!basicUtils.isValidId(fileId)) return res.status(404).send({ error: 'Not found' });

    // retrieve file document
    const fileDocument = await fileUtils.getFile({
      _id: ObjectId(fileId),
    });

    if (!fileDocument) return res.status(404).send({ error: 'Not found' });

    if (!fileDocument.isPublic && (fileDocument.userId.toString() !== userId)) {
      return res.status(404).send({ error: 'Not found' });
    }

    // If the type of the file document is folder, return an error
    if (fileDocument.type === 'folder') {
      return res.status(400).send({ error: 'A folder doesn\'t have content' });
    }

    // If the file is not locally present, return an error Not found with a status code 404
    if (!fileDocument.localPath) return res.status(404).send({ error: 'Not found' });

    const { error, code, data } = await fileUtils.fileData(fileDocument, size);

    if (error) return res.status(code).send({ error });

    const mimeType = mime.contentType(fileDocument.name);

    res.setHeader('Content-Type', mimeType);

    return res.status(200).send(data);
  }
}

export default FilesController;
