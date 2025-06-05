import { getReadableNdJsonStream } from "./ndjson-helpers.js";

const homeRunReader = await getHomeRunReader();

async function getHomeRunReader() {
  const ndjson = 'https://kurimareiji.github.io/npb2025/npb2025-homeruns.ndjson';
  return await getReadableNdJsonStream(ndjson);
}

export {
  getHomeRunReader,
  homeRunReader,
}