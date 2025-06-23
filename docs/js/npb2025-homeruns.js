import { getReadableNdJsonStream, setDbfile, } from "./ndjson-helpers.js";

const dbfile = setDbfile('../npb2025-homeruns.ndjson', import.meta);

async function getHomeRunReader() {
  return getReadableNdJsonStream(dbfile);
}

export {
  getHomeRunReader,
}
