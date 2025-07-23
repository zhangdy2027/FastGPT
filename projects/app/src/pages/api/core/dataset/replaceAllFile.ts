import { getFileById } from '@fastgpt/service/common/file/gridfs/controller';
// import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
// import { type FileIdCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api';
import { updateCollectionAndInsertData } from '@fastgpt/service/core/dataset/collection/controller';
// import { DatasetCollectionTypeEnum } from '@fastgpt/global/core/dataset/constants';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';
import { NextAPI } from '@/service/middleware/entry';
// import { ApiResponseType, type ApiRequestProps } from '@fastgpt/service/type/next';
import type { NextApiRequest, NextApiResponse } from 'next';
// import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';
// import { type CreateCollectionResponse } from '@/global/core/dataset/api';
// import { deleteRawTextBuffer } from '@fastgpt/service/common/buffer/rawText/controller';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
// import { getDatasetById } from '@/web/core/dataset/api';
// import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
// import { TrainingModeEnum } from '@fastgpt/global/core/dataset/constants';
import { uploadFile } from '@fastgpt/service/common/file/gridfs/controller';
// import { FileType, getUploadModel } from '@fastgpt/service/common/file/multer';
import { authFrequencyLimit } from '@/service/common/frequencyLimit/api';
import { addSeconds } from 'date-fns';
// import { removeFilesByPaths } from '@fastgpt/service/common/file/utils';
// import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
// import { authDatasetCollection } from '@fastgpt/service/support/permission/dataset/auth';
import { type OutLinkChatAuthProps } from '@fastgpt/global/support/permission/chat';
// import { postUploadImg, postUploadFiles } from '@/web/common/file/api';
import { type DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
// import mime from 'mime-types';
import axios from 'axios';

// type UploadDatasetFileProps = {
//   datasetId: string;
// };
// type UploadChatFileProps = {
//   appId: string;
// } & OutLinkChatAuthProps;
// type CustomNextApiRequest = {} & NextApiRequest;

// const authUploadLimit = (tmbId: string) => {
//   if (!global.feConfigs.uploadFileMaxAmount) return;
//   return authFrequencyLimit({
//     eventId: `${tmbId}-uploadfile`,
//     maxAmount: global.feConfigs.uploadFileMaxAmount * 2,
//     expiredTime: addSeconds(new Date(), 30) // 30s
//   });
// };

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

async function handler(req: NextApiRequest, res: NextApiResponse<any>): Promise<any> {
  const cList = req.body;
  if (Array.isArray(cList) && cList.length > 0) {
    const fList = cList;
    for (const item of fList) {
      const collectionId = item;
      const collection: any = await MongoDatasetCollection.findById(collectionId)
        .populate<{ dataset: DatasetSchemaType }>('dataset')
        .lean();

      const { teamId, tmbId: uid, dataset } = collection;

      const dResp = await axios.get(
        `${process.env.DOC_SERVER_URL}/shtl/api/online/downloadFile?collectionId=${collectionId}`
      );
      if (dResp.data?.msg) {
        const dFileResp = await axios.get(`${process.env.DOC_SERVER_URL}/${dResp.data.msg}`, {
          responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(dFileResp.data);
        const contentType = dFileResp.headers['content-type'];
        const fileId = await uploadFileByBuffer({
          buffer,
          filename: dResp.data.msg.split('/DownloadFile/')[1],
          contentType,
          teamId,
          uid,
          metadata: {}
        });

        const file = await getFileById({
          bucketName: BucketNameEnum.dataset,
          fileId: fileId
        });

        if (!file) {
          return Promise.reject(CommonErrEnum.fileNotFound);
        }

        await updateCollectionAndInsertData({
          teamId,
          tmbId: uid,
          collectionId: collectionId,
          newFileId: fileId,
          dataset
        });
      }
    }
  }
}

export default NextAPI(handler);
