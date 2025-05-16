import { useCallback } from 'react';
import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun
} from 'docx';
import { saveAs } from 'file-saver';

export const useMakeDataWord = () => {
  const transData = useCallback(async (md: string) => {
    try {
      md = md.trim();
      const html = marked(md);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;
      const children: Paragraph[] = [];

      for (const el of Array.from(body.children)) {
        switch (el.tagName.toLowerCase()) {
          case 'h1':
          case 'h2':
          case 'h3': {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: el.textContent || '',
                    font: '方正小标宋简体',
                    size: 44, // 二号 22pt
                    bold: true
                  })
                ],
                spacing: { line: 1060, lineRule: 'exact' },
                alignment: AlignmentType.LEFT
              })
            );
            break;
          }

          case 'p': {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: el.textContent || '',
                    font: '仿宋',
                    size: 32 // 三号 16pt
                  })
                ],
                indent: { firstLine: 420 },
                spacing: { line: 560, lineRule: 'exact' }
              })
            );
            break;
          }

          case 'ul':
          case 'ol': {
            for (const li of Array.from(el.children)) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: li.textContent || '',
                      font: '仿宋',
                      size: 32
                    })
                  ],
                  bullet: el.tagName === 'ul' ? { level: 0 } : undefined,
                  numbering: el.tagName === 'ol' ? { reference: 'num', level: 0 } : undefined,
                  indent: { left: 420 },
                  spacing: { line: 560, lineRule: 'exact' }
                })
              );
            }
            break;
          }

          case 'pre': {
            const code = el.textContent || '';
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: code,
                    font: 'Courier New',
                    size: 20
                  })
                ],
                spacing: { line: 560, lineRule: 'exact' }
              })
            );
            break;
          }

          case 'hr': {
            children.push(
              new Paragraph({
                border: {
                  bottom: {
                    color: 'auto',
                    space: 1,
                    value: 'single',
                    size: 6
                  }
                }
              })
            );
            break;
          }

          case 'table': {
            const rows = Array.from(el.querySelectorAll('tr')).map((tr) => {
              const cells = Array.from(tr.children).map((td) => {
                return new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: td.textContent?.trim() || '',
                          font: '仿宋',
                          size: 32
                        })
                      ],
                      spacing: { line: 560, lineRule: 'exact' }
                    })
                  ],
                  width: { size: 5000, type: WidthType.AUTO }
                });
              });

              return new TableRow({ children: cells });
            });

            children.push(
              new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE }
              })
            );
            break;
          }

          case 'img': {
            const src = el.getAttribute('src');
            if (src) {
              try {
                const imageBuffer = await fetch(src).then((res) => res.arrayBuffer());

                children.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imageBuffer,
                        transformation: {
                          width: 480,
                          height: 320
                        }
                      })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { line: 560, lineRule: 'exact' }
                  })
                );
              } catch (e) {
                console.warn('图片加载失败:', src);
              }
            }
            break;
          }

          default: {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: el.textContent || '',
                    font: '仿宋',
                    size: 32
                  })
                ],
                indent: { firstLine: 420 },
                spacing: { line: 560, lineRule: 'exact' }
              })
            );
          }
        }
      }

      const docx = new Document({
        sections: [
          {
            children
          }
        ]
      });

      const blob = await Packer.toBlob(docx);
      saveAs(blob, `回复内容-${Date.now()}.docx`);
    } catch (e) {
      console.error('转换失败:', e);
    }
  }, []);

  return {
    transData
  };
};
