import express from 'express';
import AppController from '../controllers/AppController';
import UserController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

// Endpoint of the API

const controllingRouters = ((app) => {
  const router = express.Router();
  app.use('/', router);

  // Route to get the status, should return the status of the API
  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });

  // Route to the stats, should return the stats API
  router.get('/status', (req, res) => {
    AppController.getStat(req, res);
  });

  // Route to post
  router.post('/users', (req, res) => {
    UserController.postNew(req, res);
  });

  // should retrieve the user base on the token used
  router.get('/users/me', (req, res) => {
    UserController.getMe(req, res);
  });

  // Auth Controller

  // should sign-in the user by generating a new authentication token
  router.get('/connect', (req, res) => {
    AuthController.getConnect(req, res);
  });

  // should sign-out the user based on the token
  router.get('/disconnect', (req, res) => {
    AuthController.getDisconnect(req, res);
  });

  // post upload route
  router.post('/files', (req, res) => {
    FilesController.postUpload(req, res);
  });

  // show document
  router.get('/files/:id', (req, res) => {
    FilesController.getShow(req, res);
  });

  // show paginated item
  router.get('/files', (req, res) => {
    FilesController.getIndex(req, res);
  });

  // publish the file document
  router.put('/files/:id/publish', (req, res) => {
    FilesController.putPublish(req, res);
  });

  // unpulish the file document
  router.put('/files/:id/unpublish', (req, res) => {
    FilesController.putUnpublish(req, res);
  });

  // Get files content
  router.get('/files/:id/data', (req, res) => {
    FilesController.getFile(req, res);
  });
});

export default controllingRouters;
