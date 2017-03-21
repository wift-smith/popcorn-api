// Import the neccesary modules.
import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  dbName,
  statusFile,
  tempDir,
  updatedFile
} from './config/constants';
import { name } from '../package.json';

/**
 * Create an emty file.
 * @param {String} path - The path to the file to create.
 * @returns {void}
 */
function _createEmptyFile(path) {
  fs.createWriteStream(path).end();
}

/**
 * Removes all the files in the temporary directory.
 * @param {String} [tmpPath=popcorn-api/tmp] - The path to remove all the files
 * within (Default is set in the `config/constants.js`).
 * @returns {void}
 */
function _resetTemp(tmpPath = tempDir) {
  const files = fs.readdirSync(tmpPath);
  files.forEach(file => {
    const stats = fs.statSync(path.join(tmpPath, file));
    if (stats.isDirectory()) {
      _resetTemp(file);
    } else if (stats.isFile()) {
      fs.unlinkSync(path.join(tmpPath, file));
    }
  });
}

/**
 * Returns the epoch time.
 * @returns {Number} - Epoch time.
 */
function _now() {
  return Math.floor(new Date().getTime() / 1000);
}


/**
 * Create the temporary directory.
 * @returns {void}
 */
export function createTemp() {
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  if (fs.existsSync(tempDir)) _resetTemp();

  _createEmptyFile(path.join(tempDir, statusFile));
  _createEmptyFile(path.join(tempDir, updatedFile));
}

/**
 * Execute a command from within the root folder.
 * @param {String} cmd - The command to execute.
 * @returns {Promise} - The output of the command.
 */
export function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, {
      cwd: __dirname
    }, (err, stdout) => {
      if (err) return reject(err);
      return resolve(stdout.split('\n').join(''));
    });
  });
}

/**
 * Export a collection to a JSON file.
 * @param {String} collection - The collection to export.
 * @returns {Promise} - The output of the mongoexport command.
 */
export function exportCollection(collection) {
  const jsonFile = path.join(tempDir, `${collection}s.json`);
  logger.info(`Exporting collection: '${collection}s', to: '${jsonFile}'`);

  const cmd = `mongoexport -d ${dbName} -c ${collection}s -o '${jsonFile}'`;
  return executeCommand(cmd);
}

/**
 * Import a json file to a collection.
 * @param {String} collection - The collection to import.
 * @param {String} jsonFile - The json file to import..
 * @returns {Promise} - The output of the mongoimport command.
 */
export function importCollection(collection, jsonFile) {
  if (!path.isAbsolute(jsonFile))
    jsonFile = path.join(process.cwd(), jsonFile); // eslint-disable-line no-param-reassign
  if (!fs.existsSync(jsonFile))
    throw new Error(`Error: no such file found for '${jsonFile}'`);

  logger.info(`Importing collection: '${collection}', from: '${jsonFile}'`);

  const cmd = `mongoimport -d ${dbName} -c ${collection}s --file '${jsonFile}' --upsert`;
  return executeCommand(cmd);
}

/**
 * Error logger function.
 * @param {String} errorMessage - The error message you want to display.
 * @returns {Error} - A new error with the given error message.
 */
export function onError(errorMessage) {
  logger.error(errorMessage);
  return new Error(errorMessage);
}

/**
 * Reset the default log file.
 * @returns {void}
 */
export function resetLog() {
  const logFile = path.join(tempDir, `${name}.log`);
  if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
}

/**
 * Search for a key in an array of object.
 * @param {String} key - The key to search for.
 * @param {String} value - The value of the key to search for.
 * @return {Object} - The object with the correct key-value pair.
 */
export function search(key, value) {
  return element => element[key] === value;
}

/**
 * Updates the `lastUpdated.json` file.
 * @param {String} [updated=Date.now()] - The epoch time when the API last
 * started scraping.
 * @returns {void}
 */
export function setLastUpdated(updated = _now()) {
  fs.writeFile(path.join(tempDir, updatedFile), JSON.stringify({
    updated
  }), () => {});
}

/**
 * Updates the `status.json` file.
 * @param {String} [status=Idle] - The status which will be set to in the
 * `status.json` file.
 * @returns {void}
 */
export function setStatus(status = 'Idle') {
  fs.writeFile(path.join(tempDir, statusFile), JSON.stringify({
    status
  }), () => {});
}
