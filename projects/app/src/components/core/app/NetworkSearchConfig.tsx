import MyIcon from '@fastgpt/web/components/common/Icon';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { Box, Button, Flex, ModalBody, useDisclosure, Switch } from '@chakra-ui/react';
import React from 'react';
import { useTranslation } from 'next-i18next';
import type { AppNetworkSearchConfigType } from '@fastgpt/global/core/app/type.d';
import MyModal from '@fastgpt/web/components/common/MyModal';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { defaultNetworkSearchConfig } from '@fastgpt/global/core/app/constants';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';

const NetworkSearchConfig = ({
  isOpenNetworkSearch,
  value = defaultNetworkSearchConfig,
  onChange
}: {
  isOpenNetworkSearch: boolean;
  value?: AppNetworkSearchConfigType;
  onChange: (e: AppNetworkSearchConfigType) => void;
}) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isOpenNetwork = value.open;

  const formLabel = isOpenNetwork
    ? t('common:core.app.whisper.Open')
    : t('common:core.app.whisper.Close');

  return (
    <Flex alignItems={'center'}>
      <MyIcon name={'core/chat/networkIcon'} mr={2} w={'20px'} color={'#DB1010'} />
      <FormLabel color={'myGray.600'}>{'联网搜索'}</FormLabel>
      <Box flex={1} />
      <MyTooltip label={'配置联网搜索'}>
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
        title={'联网搜索配置'}
        iconSrc="core/chat/networkIcon"
        iconColor="#DB1010"
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalBody px={[5, 16]} py={[4, 8]}>
          <Flex justifyContent={'space-between'} alignItems={'center'}>
            <FormLabel>{'开启联网搜索'}</FormLabel>
            <Switch
              isChecked={isOpenNetwork}
              onChange={(e) => {
                onChange({
                  ...value,
                  open: e.target.checked
                });
              }}
            />
          </Flex>
        </ModalBody>
      </MyModal>
    </Flex>
  );
};

export default React.memo(NetworkSearchConfig);
