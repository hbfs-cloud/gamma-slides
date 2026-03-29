import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(resolve(__dirname, 'deck.schema.json'), 'utf-8'));

const ajv = new Ajv({ allErrors: true, useDefaults: true, validateSchema: false });
addFormats(ajv);

const validate = ajv.compile(schema);

export function validateDeck(deck) {
  const valid = validate(deck);
  return {
    valid,
    errors: validate.errors || []
  };
}

export { schema };
