import { ObjectId } from 'mongodb';

/**
 * Module with basic utilities
 */

const basicUtils = {
  /**
   * Checks id Id is Valid for Mongo
   * @id {string|number} id to be evaluated
   * @return {boolean} true if valid, false if not
   */

  isValidId(id) {
    try {
      if (ObjectId(id));
    } catch (err) {
      return false;
    }
    return true;
  },
};

export default basicUtils;
