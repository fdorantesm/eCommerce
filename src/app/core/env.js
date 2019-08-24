import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';


const NODE_ENV = process.env.NODE_ENV;
const PWD = process.env.PWD;

const $root = PWD;
const SRC_PATH = path.join($root, 'src').split('/');

process.env.ROOT_PATH = $root;
process.env.SRC_PATH = SRC_PATH.join('/');
process.env.STORAGE_PATH = path.join(process.env.SRC_PATH, 'storage');
const envFile = getEnv(NODE_ENV);

const file = fs.existsSync(envFile) ? envFile : getEnv();

if (!fs.existsSync(file)) {
  fs.writeFileSync(file, '');
}

dotenv.config({
  path: file
});

process.env.APP_PATH = path.join(process.env.SRC_PATH, 'app');

/**
 * Get env path
 * @param {String} environment
 * @return {String}
 */
function getEnv(environment = null) {
  const suffix = environment === null ? '' : `.${environment}`;
  return path.join($root, `.env${suffix}`);
}

export default process.env;