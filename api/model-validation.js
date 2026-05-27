/** Shared model validation for both Node.js and Vercel serverless runtimes. */
export const VALID_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'];
export const DEFAULT_MODEL = 'deepseek-v4-flash';

export function getValidModel(model) {
  return VALID_MODELS.includes(model) ? model : DEFAULT_MODEL;
}
