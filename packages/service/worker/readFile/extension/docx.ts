import mammoth, { images } from 'mammoth';
import { type ReadRawTextByBuffer, type ReadFileResponse, type ImageType } from '../type';
import { html2md } from '../../htmlStr2Md/utils';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';

/**
 * read docx to markdown
 */
export const readDocsFile = async ({ buffer }: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
  const imageList: ImageType[] = [];
  try {
    const { value: html } = await mammoth.convertToHtml(
      {
        buffer
      },
      {
        ignoreEmptyParagraphs: false,
        convertImage: images.imgElement(async (image) => {
          const imageBase64 = await image.readAsBase64String();
          const uuid = crypto.randomUUID();
          const mime = image.contentType;
          imageList.push({
            uuid,
            base64: imageBase64,
            mime
          });
          return {
            src: uuid
          };
        })
      }
    );

    const { rawText } = html2md(html);

    return {
      rawText,
      imageList
    };
  } catch (error) {
    console.log('error doc read:', error);
    return Promise.reject('Can not read doc file, please convert to PDF');
  }
};

export const readDocFile = async ({ buffer }: ReadRawTextByBuffer): Promise<ReadFileResponse> => {
  const imageList: ImageType[] = [];

  // 1. 创建临时路径
  const tmpDir = path.join(os.tmpdir(), 'doc-upload');
  await fs.mkdir(tmpDir, { recursive: true });
  const uuid = crypto.randomUUID();
  const tempDocPath = path.join(tmpDir, `${uuid}.doc`);
  const tempDocxPath = tempDocPath.replace(/\.doc$/, '.docx');

  try {
    // 2. 写入 buffer 到临时 .doc 文件
    await fs.writeFile(tempDocPath, buffer);

    // 3. 转换 .doc → .docx
    await new Promise<void>((resolve, reject) => {
      exec(
        `soffice --headless --convert-to docx --outdir "${tmpDir}" "${tempDocPath}"`,
        (err, stdout, stderr) => {
          if (err) {
            console.error('LibreOffice 转换失败:', stderr);
            return reject(new Error('DOC 文件转换失败'));
          }
          resolve();
        }
      );
    });

    // 4. 读取 .docx 文件，使用 mammoth 提取 HTML
    const docxBuffer = await fs.readFile(tempDocxPath);
    const { value: html } = await mammoth.convertToHtml(
      { buffer: docxBuffer },
      {
        ignoreEmptyParagraphs: false,
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBase64 = await image.readAsBase64String();
          const uuid = crypto.randomUUID();
          const mime = image.contentType;
          imageList.push({ uuid, base64: imageBase64, mime });
          return { src: uuid };
        })
      }
    );

    // 5. HTML 转 Markdown
    const { rawText } = html2md(html);

    return {
      rawText,
      imageList
    };
  } catch (err) {
    console.error('读取 .doc 文件失败:', err);
    throw new Error('无法读取 .doc 文件');
  } finally {
    await fs.unlink(tempDocPath).catch(() => {});
    await fs.unlink(tempDocxPath).catch(() => {});
  }
};
