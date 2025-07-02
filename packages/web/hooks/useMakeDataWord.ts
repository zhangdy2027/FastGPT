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
// import * as echarts from 'echarts';
import { saveAs } from 'file-saver';

// const renderEchartsToImage = async (options: any, width = 600, height = 400) => {
//   try {
//     const container = document.createElement('div');
//     container.style.width = `${width}px`;
//     container.style.height = `${height}px`;
//     document.body.appendChild(container);

//     const chart = echarts.init(container);
//     chart.setOption(options);

//     // 等待渲染完成
//     await new Promise((resolve) => setTimeout(resolve, 500));

//     const dataURL = chart.getDataURL({
//       type: 'png',
//       pixelRatio: 2,
//       backgroundColor: '#fff'
//     });

//     chart.dispose();
//     document.body.removeChild(container);

//     // 将 dataURL 转换为 ArrayBuffer
//     const response = await fetch(dataURL);
//     return await response.arrayBuffer();
//   } catch (error) {
//     console.error('ECharts 渲染失败:', error);
//     return null;
//   }
// };

// 添加处理节点的辅助函数
const processNode = async (node: Node): Promise<any[]> => {
  const runs = [];

  // 处理文本节点
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent?.trim()) {
      runs.push(
        new TextRun({
          text: node.textContent,
          font: '仿宋',
          size: 32
        })
      );
    }
    return runs;
  }

  // 处理元素节点
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;

    switch (el.tagName.toLowerCase()) {
      case 'strong':
      case 'b':
        for (const child of Array.from(el.childNodes)) {
          const childRuns = await processNode(child);
          runs.push(
            ...childRuns.map((run) => {
              if (run instanceof TextRun) {
                return new TextRun({
                  text: el.textContent || '',
                  font: '仿宋',
                  size: 32,
                  ...run.options,
                  bold: true
                });
              }
              return run;
            })
          );
        }
        break;
      case 'a':
        const href = el.getAttribute('href')?.trim();
        const text = el.textContent?.trim();

        // 如果是 [xxx](QUOTE) 格式，直接忽略
        if (href === 'QUOTE' && /^[0-9a-f]{24}$/i.test(text || '')) {
          return []; // 忽略
        }

        // 否则正常递归处理子节点
        for (const child of Array.from(el.childNodes)) {
          const childRuns = await processNode(child);
          runs.push(...childRuns);
        }
        break;
      case 'em':
      case 'i':
        for (const child of Array.from(el.childNodes)) {
          const childRuns = await processNode(child);
          runs.push(
            ...childRuns.map((run) => {
              if (run instanceof TextRun) {
                return new TextRun({ ...run.options, italics: true });
              }
              return run;
            })
          );
        }
        break;

      case 'img':
        const src = el.getAttribute('src');
        console.log('imgimgimgimgimgimg', src);
        if (src) {
          try {
            const imageBuffer = await fetch(src).then((res) => res.arrayBuffer());
            runs.push(
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 480,
                  height: 320
                }
              })
            );
          } catch (e) {
            console.warn('图片加载失败:', src);
          }
        }
        break;

      default:
        // 递归处理子节点
        for (const child of Array.from(el.childNodes)) {
          const childRuns = await processNode(child);
          runs.push(...childRuns);
        }
    }
  }

  return runs;
};

export const useMakeDataWord = () => {
  const transData = useCallback(async (md: string) => {
    try {
      md = md.trim();

      let listCounter = 0;
      // const numberingMap = new Map<string, string>();
      const numberingConfig: any[] = [];

      const html = marked(md);

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;
      const children: any[] = [];

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
            const runs = await processNode(el);
            children.push(
              new Paragraph({
                children: runs,
                indent: { firstLine: 640 },
                spacing: { line: 560, lineRule: 'atLeast' }
              })
            );
            break;
          }
          case 'ul':
          case 'ol': {
            const ref = `num-${listCounter++}`;
            // numberingMap.set(el, ref);

            numberingConfig.push({
              reference: ref,
              levels: [
                {
                  level: 0,
                  format: 'decimal',
                  text: '%1.',
                  alignment: AlignmentType.START,
                  style: {
                    paragraph: {
                      indent: { left: 420 }
                    }
                  }
                }
              ]
            });

            for (const li of Array.from(el.children)) {
              // 使用 processNode 处理 li 中的富文本内容
              const runs = await processNode(li);
              children.push(
                new Paragraph({
                  children: runs,
                  bullet: el.tagName.toLowerCase() === 'ul' ? { level: 0 } : undefined,
                  numbering:
                    el.tagName.toLowerCase() === 'ol' ? { reference: ref, level: 0 } : undefined,
                  indent: { left: 420 },
                  spacing: { line: 560, lineRule: 'atLeast' }
                })
              );
            }
            break;
          }
          case 'pre': {
            const code = el.textContent || '';

            // // 检查是否是 echarts 代码块
            // const codeElement = el.querySelector('code');
            // if (
            //   codeElement &&
            //   (codeElement.classList.contains('language-echarts') ||
            //     codeElement.classList.contains('echarts'))
            // ) {
            //   try {
            //     // const newCode = `(${code})`;
            //     const parseObj = new Function(`return ${code}`);
            //     const option = parseObj();
            //     const imageBuffer = await renderEchartsToImage(option);

            //     if (imageBuffer) {
            //       children.push(
            //         new Paragraph({
            //           children: [
            //             new ImageRun({
            //               data: imageBuffer,
            //               transformation: {
            //                 width: 480,
            //                 height: 320
            //               }
            //             })
            //           ],
            //           spacing: { line: 560, lineRule: 'atLeast' }
            //           // alignment: AlignmentType.CENTER,
            //           // spacing: {
            //           //   line: 1440, // 增加行高到原来的2.5倍左右
            //           //   lineRule: 'atLeast'
            //           // }
            //         })
            //       );
            //       break;
            //     }
            //   } catch (e) {
            //     console.warn('ECharts 解析失败，回退到文本显示:', e);
            //   }
            // }

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: code,
                    // font: 'Courier New',
                    size: 20
                  })
                ],
                spacing: { line: 560, lineRule: 'atLeast' }
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
            const rows = Array.from(el.querySelectorAll('tr')).map(async (tr) => {
              const cells = await Promise.all(
                Array.from(tr.children).map(async (td) => {
                  const runs = await processNode(td);
                  return new TableCell({
                    children: [
                      new Paragraph({
                        children: runs,
                        spacing: { line: 560, lineRule: 'atLeast' }
                      })
                    ],
                    width: { size: 5000, type: WidthType.AUTO }
                  });
                })
              );

              return new TableRow({ children: cells });
            });

            children.push(
              new Table({
                rows: await Promise.all(rows),
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
                    spacing: { line: 560, lineRule: 'atLeast' }
                    // alignment: AlignmentType.CENTER,
                    // spacing: {
                    //   line: 1440, // 增加行高到原来的2.5倍左右
                    //   lineRule: 'atLeast'
                    // }
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
                indent: { firstLine: 640 },
                spacing: { line: 560, lineRule: 'atLeast' }
              })
            );
          }
        }
      }

      const docx = new Document({
        numbering: {
          config: numberingConfig
        },
        sections: [
          {
            children
          }
        ]
      });

      const blob = await Packer.toBlob(docx);
      saveAs(blob, `回复内容-${Date.now()}.docx`);
      return true;
    } catch (e) {
      console.error('转换失败:', e);
      return true;
    }
  }, []);

  return {
    transData
  };
};
