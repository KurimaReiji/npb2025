
class NdJsonStream extends TransformStream {
  constructor() {
    super({
      transform(chunk, controller) {
        const lines = `${this._remainder || ""}${chunk}`.split(/\r?\n/);
        this._remainder = lines.pop();
        try {
          const parsed = JSON.parse(`[${lines.filter(Boolean).join(",")}]`);
          parsed.forEach((item) => {
            controller.enqueue(item);
          });
        } catch (error) {
          console.error("JSON parse error:", error, `\nRaw chunk: "${chunk}"`, `\nLines: ${JSON.stringify(lines)}`);
        }
      },
      flush(controller) {
        if (this._remainder) {
          try {
            const parsed = JSON.parse(`[${this._remainder}]`);
            parsed.forEach((item) => {
              controller.enqueue(item);
            });
          } catch (error) {
            console.error("JSON parse error on flush:", error, `\nRemainder: "${this._remainder}"`);
          }
          this._remainder = "";
        }
      }
    });
    this._remainder = "";
  }
}

async function getReadableNdJsonStream(dbfile) {
  let readableStream;
  if (typeof window === 'undefined') {
    const { createReadStream: nodeCreateReadStream } = await import('node:fs');
    const { Readable: nodeReadable } = await import('node:stream');
    readableStream = nodeReadable.toWeb(nodeCreateReadStream(dbfile));
  } else {
    readableStream = (await fetch(dbfile)).body;
  }
  return readableStream
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new NdJsonStream())
    ;
}

async function createNdjsonWriter(filePath) {
  const { appendFileSync } = await import('node:fs');

  return function (data) {
    appendFileSync(filePath, JSON.stringify(data) + '\n', 'utf-8');
  };
}

export {
  NdJsonStream,
  getReadableNdJsonStream,
  createNdjsonWriter,
}