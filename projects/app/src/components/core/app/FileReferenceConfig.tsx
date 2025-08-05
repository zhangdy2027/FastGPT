import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { Box, Button, Flex, ModalBody, useDisclosure, Switch, HStack } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'next-i18next';
import type { AppFileReferenceConfigType } from '@fastgpt/global/core/app/type.d';
import MyModal from '@fastgpt/web/components/common/MyModal';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { defaultFileReferenceConfig } from '@fastgpt/global/core/app/constants';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';

const FileReferenceConfig = ({
  value = defaultFileReferenceConfig,
  onChange
}: {
  value?: AppFileReferenceConfigType;
  onChange: (e: AppFileReferenceConfigType) => void;
}) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isOpenFile = value.open;

  const formLabel = isOpenFile
    ? t('common:core.app.whisper.Open')
    : t('common:core.app.whisper.Close');

  return (
    <Flex alignItems={'center'}>
      <MyIcon name={'core/chat/quoteFill'} mr={2} w={'20px'} color={'#E82F72'} />
      <HStack ml={0} flex={1} spacing={1}>
        <FormLabel color={'myGray.600'}>{'文件引用'}</FormLabel>
        <QuestionTip label={'开启后，AI回复中引用的知识库文件，所有用户均可以查看'} />
      </HStack>
      <MyTooltip label={'配置文件引用'}>
        <Button
          variant={'transparentBase'}
          iconSpacing={1}
          size={'sm'}
          mr={'-5px'}
          color={'myGray.600'}
          onClick={onOpen}
        >
          {formLabel}
        </Button>
      </MyTooltip>
      <MyModal
        title={'文件引用配置'}
        iconSrc="core/chat/quoteFill"
        iconColor="#E82F72"
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalBody px={[5, 16]} py={[4, 8]}>
          <Flex justifyContent={'space-between'} alignItems={'center'}>
            <FormLabel>{'开启文件引用'}</FormLabel>
            <Switch
              isChecked={isOpenFile}
              onChange={(e) => {
                onChange({
                  ...value,
                  open: e.target.checked
                });
              }}
            />
          </Flex>
          {isOpenFile && (
            <Flex mt={8} alignItems={'center'}>
              <FormLabel>{'引用文件'}</FormLabel>
              {/* <QuestionTip label={''} /> */}
              <Box flex={'1 0 0'} />
              <Switch
                isChecked={value.reference}
                onChange={(e) => {
                  onChange({
                    ...value,
                    reference: e.target.checked
                  });
                }}
              />
            </Flex>
          )}
          {isOpenFile && (
            <Flex mt={8} alignItems={'center'}>
              <FormLabel>{'查看详情'}</FormLabel>
              {/* <QuestionTip label={''} /> */}
              <Box flex={'1 0 0'} />
              <Switch
                isChecked={value.detail}
                onChange={(e) => {
                  onChange({
                    ...value,
                    detail: e.target.checked
                  });
                }}
              />
            </Flex>
          )}
        </ModalBody>
      </MyModal>
    </Flex>
  );
};

export default React.memo(FileReferenceConfig);
