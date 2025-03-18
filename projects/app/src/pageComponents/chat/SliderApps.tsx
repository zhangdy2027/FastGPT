import React, { useCallback, useState } from 'react';
import {
  Flex,
  Box,
  IconButton,
  HStack,
  Image,
  InputGroup,
  InputLeftElement,
  Input
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import MyDivider from '@fastgpt/web/components/common/MyDivider';
import MyPopover from '@fastgpt/web/components/common/MyPopover/index';
import { getMyApps } from '@/web/core/app/api';
import {
  GetResourceFolderListProps,
  GetResourceListItemResponse
} from '@fastgpt/global/common/parentFolder/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import dynamic from 'next/dynamic';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import { useContextSelector } from 'use-context-selector';
import { debounce } from 'lodash';

const SelectOneResource = dynamic(() => import('@/components/common/folder/SelectOneResource'));

const SliderApps = ({ apps, activeAppId }: { apps: AppListItemType[]; activeAppId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isTeamChat = router.pathname === '/chat/team';

  const showRouteToAppDetail = useContextSelector(ChatItemContext, (v) => v.showRouteToAppDetail);

  const [searchFlag, setSearchFlag] = useState<boolean>(false);
  const [searchApps, setSearchApps] = useState<any[]>([]);

  const getAppList = useCallback(async ({ parentId }: GetResourceFolderListProps) => {
    return getMyApps({
      parentId,
      type: [AppTypeEnum.folder, AppTypeEnum.simple, AppTypeEnum.workflow, AppTypeEnum.plugin]
    }).then((res) =>
      res.map<GetResourceListItemResponse>((item) => ({
        id: item._id,
        name: item.name,
        avatar: item.avatar,
        isFolder: item.type === AppTypeEnum.folder
      }))
    );
  }, []);

  const onChangeApp = useCallback(
    (appId: string) => {
      router.replace({
        query: {
          ...router.query,
          appId
        }
      });
    },
    [router]
  );

  const getSearchApp = async (value: string) => {
    const resp = await getMyApps({ searchKey: value });
    setSearchApps(resp);
  };

  const searchKeyChange = debounce((e: any) => {
    if (e.target?.value) {
      setSearchFlag(true);
      getSearchApp(e.target?.value);
    } else {
      setSearchApps([]);
      setSearchFlag(false);
    }
  }, 500);

  return (
    <Flex flexDirection={'column'} h={'100%'} bgColor={'#ffffff'}>
      {showRouteToAppDetail && (
        <>
          <Box
            mt={0}
            p={3}
            background={
              'linear-gradient(180deg, rgba(255, 0, 0, 0.06) 0%, rgba(255, 0, 0, 0) 100%)'
            }
          >
            <Flex
              alignItems={'center'}
              cursor={'pointer'}
              borderRadius={'md'}
              // _hover={{ bg: 'myGray.200' }}
              // onClick={() => router.push('/app/list')}
            >
              {/* <IconButton
                mr={3}
                icon={<MyIcon name={'common/backFill'} w={'1rem'} color={'primary.500'} />}
                bg={'white'}
                boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
                size={'smSquare'}
                borderRadius={'50%'}
                aria-label={''}
              />
              {t('common:core.chat.Exit Chat')} */}
              <Flex flexDirection={'column'} gap={4}>
                <Flex alignItems={'center'} justifyContent={'center'} gap={3}>
                  <Image
                    src="https://bit.ly/dan-abramov"
                    borderRadius="full"
                    boxSize="32px"
                    alt="Dan Abramov"
                  />
                  <Box fontSize={24}>{'朔风智语'}</Box>
                </Flex>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="tel"
                    placeholder="搜索智能体"
                    backgroundColor={'#ffffff'}
                    onChange={searchKeyChange}
                  />
                </InputGroup>
              </Flex>
            </Flex>
          </Box>
          {/* <MyDivider h={2} my={1} /> */}
        </>
      )}

      {searchFlag && (
        <Box flex={'1 0 0'} px={4} h={0} overflow={'overlay'}>
          {searchApps.map((item) => (
            <Flex
              key={item._id}
              py={2}
              px={3}
              mb={3}
              cursor={'pointer'}
              borderRadius={'md'}
              alignItems={'center'}
              fontSize={'sm'}
              boxSizing={'border-box'}
              {...(item._id === activeAppId
                ? {
                    bg: 'rgba(255, 0, 36, 0.04)',
                    border: '1px solid rgba(255, 0, 0, 0.1)',
                    boxShadow: 'md'
                    // color: 'primary.600'
                  }
                : {
                    border: '1px solid #F1F2F3',
                    _hover: {
                      bg: 'myGray.200'
                    },
                    onClick: () => onChangeApp(item._id)
                  })}
            >
              <Avatar src={item.avatar} w={6} borderRadius={'md'} />
              <Flex flexDir={'column'} gap={2} w={'calc(100% - 20px)'}>
                <Box ml={2} className={'textEllipsis'} fontSize={'14px'}>
                  {item.name}
                </Box>
                <Box ml={2} className={'textEllipsis'} fontSize={'12px'} color={'#4B5563'}>
                  {item.intro ? item.intro : t('common.no_intro')}
                </Box>
              </Flex>
            </Flex>
          ))}
        </Box>
      )}

      {!isTeamChat && !searchFlag && (
        <>
          <HStack
            px={4}
            my={2}
            color={'myGray.500'}
            fontSize={'sm'}
            justifyContent={'space-between'}
          >
            <Box>{t('common:core.chat.Recent use')}</Box>
            <MyPopover
              placement="bottom-end"
              offset={[20, 10]}
              p={4}
              trigger="hover"
              Trigger={
                <HStack
                  spacing={0.5}
                  cursor={'pointer'}
                  px={2}
                  py={'0.5'}
                  borderRadius={'md'}
                  mr={-2}
                  userSelect={'none'}
                  _hover={{
                    bg: 'myGray.200'
                  }}
                >
                  <Box>{t('common:common.More')}</Box>
                  <MyIcon name={'common/select'} w={'1rem'} />
                </HStack>
              }
            >
              {({ onClose }) => (
                <Box minH={'200px'}>
                  <SelectOneResource
                    maxH={'60vh'}
                    value={activeAppId}
                    onSelect={(id) => {
                      if (!id) return;
                      onChangeApp(id);
                      onClose();
                    }}
                    server={getAppList}
                  />
                </Box>
              )}
            </MyPopover>
          </HStack>
        </>
      )}

      {!searchFlag && (
        <Box flex={'1 0 0'} px={4} h={0} overflow={'overlay'}>
          {apps.map((item) => (
            <Flex
              key={item._id}
              py={2}
              px={3}
              mb={3}
              cursor={'pointer'}
              borderRadius={'md'}
              alignItems={'center'}
              fontSize={'sm'}
              boxSizing={'border-box'}
              {...(item._id === activeAppId
                ? {
                    bg: 'rgba(255, 0, 36, 0.04)',
                    border: '1px solid rgba(255, 0, 0, 0.1)',
                    boxShadow: 'md'
                    // color: 'primary.600'
                  }
                : {
                    border: '1px solid #F1F2F3',
                    _hover: {
                      bg: 'myGray.200'
                    },
                    onClick: () => onChangeApp(item._id)
                  })}
            >
              <Avatar src={item.avatar} w={6} borderRadius={'md'} />
              <Flex flexDir={'column'} gap={2} w={'calc(100% - 20px)'}>
                <Box ml={2} className={'textEllipsis'} fontSize={'14px'}>
                  {item.name}
                </Box>
                <Box ml={2} className={'textEllipsis'} fontSize={'12px'} color={'#4B5563'}>
                  {item.intro ? item.intro : t('common.no_intro')}
                </Box>
              </Flex>
            </Flex>
          ))}
        </Box>
      )}
    </Flex>
  );
};

export default React.memo(SliderApps);
