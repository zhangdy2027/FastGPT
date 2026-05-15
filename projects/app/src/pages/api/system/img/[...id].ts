import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import path from 'path';

import { readMongoImg } from '@fastgpt/service/common/file/image/controller';
import { Types } from '@fastgpt/service/common/mongo';
import { getS3AvatarSource } from '@fastgpt/service/common/s3/sources/avatar';
import { Mimes } from '@fastgpt/service/common/s3/constants';

// get the models available to the system
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query as { id: string[] };

    const joined = id.join('/');
    const parsed = path.parse(joined);
    const keys = path.format({ dir: parsed.dir, name: parsed.name, ext: '' });

    if (Types.ObjectId.isValid(keys)) {
      const { binary, mime } = await readMongoImg({ id: joined });
      res.setHeader('Content-Type', mime);
      res.send(binary);
      return;
    }

    const { stat, stream } = await getS3AvatarSource().readAvatar(joined);
    const contentType =
      stat.metaData?.['content-type'] || Mimes[parsed.ext.toLowerCase() as keyof typeof Mimes];

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Length', stat.size);

    stream.pipe(res);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    stream.on('end', () => {
      res.end();
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}
