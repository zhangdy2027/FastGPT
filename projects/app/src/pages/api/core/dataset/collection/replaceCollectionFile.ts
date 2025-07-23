import { getFileById } from '@fastgpt/service/common/file/gridfs/controller';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
// import { type FileIdCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api';
import { updateCollectionAndInsertData } from '@fastgpt/service/core/dataset/collection/controller';
// import { DatasetCollectionTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import { NextAPI } from '@/service/middleware/entry';
import { type ApiRequestProps } from '@fastgpt/service/type/next';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
// import { type CreateCollectionResponse } from '@/global/core/dataset/api';
import { deleteRawTextBuffer } from '@fastgpt/service/common/buffer/rawText/controller';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
// import { getDatasetById } from '@/web/core/dataset/api';
// import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
// import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { uploadFile } from '@fastgpt/service/common/file/gridfs/controller';
import axios from 'axios';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

const uploadFileByBuffer = async ({
  buffer,
  filename,
  contentType,
  teamId,
  uid,
  metadata = {}
}: {
  buffer: Buffer;
  filename: string;
  contentType?: string;
  teamId: string;
  uid: string;
  metadata?: Record<string, any>;
}): Promise<string> => {
  const tmpPath = path.join(tmpdir(), `${Date.now()}-${filename}`);
  await fs.writeFile(tmpPath, buffer);

  const fileId = await uploadFile({
    teamId,
    uid,
    bucketName: 'dataset',
    path: tmpPath,
    filename,
    contentType: contentType || 'application/octet-stream',
    metadata
  });

  await fs.unlink(tmpPath).catch(() => {});

  return fileId;
};

async function handler(req: ApiRequestProps<any>): Promise<any> {
  const { collectionId, datasetId } = req.body;

  const { teamId, tmbId, dataset } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    per: WritePermissionVal,
    datasetId: datasetId
  });

  const dResp = await axios.get(
    `${process.env.DOC_SERVER_URL}/shtl/api/online/downloadFile?collectionId=${collectionId}`
  );
  if (dResp.data?.msg) {
    const dFileResp = await axios.get(`${process.env.DOC_SERVER_URL}/${dResp.data.msg}`, {
      responseType: 'arraybuffer'
    });
    const buffer = Buffer.from(dFileResp.data);
    const contentType = dFileResp.headers['content-type'];
    const newFileId = await uploadFileByBuffer({
      buffer,
      filename: dResp.data.msg.split('/DownloadFile/')[1],
      contentType,
      teamId,
      uid: tmbId,
      metadata: {}
    });

    const file = await getFileById({
      bucketName: BucketNameEnum.dataset,
      fileId: newFileId
    });

    if (!file) {
      return Promise.reject(CommonErrEnum.fileNotFound);
    }

    const { collectionId: newCollectionId, insertResults } = await updateCollectionAndInsertData({
      teamId,
      tmbId,
      collectionId,
      newFileId,
      dataset
    });

    // remove buffer
    await deleteRawTextBuffer(newFileId);

    return {
      collectionId: newCollectionId,
      results: insertResults
    };
  }
}

export default NextAPI(handler);
