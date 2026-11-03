/**
 * Whether sections fall back to built-in sample content when the API has no
 * data for them (a fresh or empty database). On by default in every
 * environment, including production deployments, so the live site looks the
 * same as local development. Set `SHOW_SAMPLE_DATA=false` to hide those
 * sections instead once real content is in place.
 */
export const SHOW_SAMPLE_DATA = process.env.SHOW_SAMPLE_DATA !== "false";
