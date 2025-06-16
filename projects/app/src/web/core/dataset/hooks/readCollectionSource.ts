import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getCollectionSource } from '@/web/core/dataset/api';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'next-i18next';
import type { readCollectionSourceBody } from '@/pages/api/core/dataset/collection/read';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function getCollectionSourceAndOpen(
  props: { collectionId: string } & readCollectionSourceBody
) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setLoading } = useSystemStore();

  return async () => {
    try {
      setLoading(true);

      const { value: url } = await getCollectionSource(props);

      if (!url) {
        throw new Error('No file found');
      }

      if (url.startsWith('/')) {
        window.open(`${location.origin}${url}`, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast({
        title: t(getErrText(error, t('common:error.fileNotFound'))),
        status: 'error'
      });
    }
    setLoading(false);
  };
}

export function getAllCollectionSourceAndOpen(props: { collectionList: any[] }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setLoading } = useSystemStore();

  return async () => {
    try {
      setLoading(true);
      const zip = new JSZip();
      const reqList = props.collectionList.map((item) =>
        getCollectionSource({ collectionId: item.collectionId })
      );
      const list = await Promise.all(reqList);
      for (const i in list) {
        const item = list[i];
        if (item.type === 'url' && item.value) {
          const response = await fetch(item.value);
          const blob = await response.blob();

          const fileName = props.collectionList[i].sourceName;
          zip.file(fileName, blob);
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `引用-${Date.now()}.zip`);
    } catch (error) {
      toast({
        title: t(getErrText(error, t('common:error.fileNotFound'))),
        status: 'error'
      });
    }
    setLoading(false);
  };
}
