import { useCallback } from 'react';
import { marked } from 'marked';
import { saveAs } from 'file-saver';
import htmlToDocx from 'html-to-docx';

export const useMakeDataWord = () => {
  const transData = useCallback(async (data: string) => {
    data = data.trim();

    const html = marked(data);

    const docxBlob = await htmlToDocx(html, {
      pageOrientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 }, // 1 inch
      footer: false
    });

    saveAs(docxBlob, 'markdown.docx');
  }, []);

  return {
    transData
  };
};
