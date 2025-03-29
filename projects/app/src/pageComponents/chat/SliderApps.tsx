import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flex,
  Box,
  IconButton,
  HStack,
  Image,
  InputGroup,
  InputLeftElement,
  Input,
  Accordion,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  AccordionItem
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import MyDivider from '@fastgpt/web/components/common/MyDivider';
import MyPopover from '@fastgpt/web/components/common/MyPopover/index';
import { getMyApps, getAllMyApps } from '@/web/core/app/api';
import {
  GetResourceFolderListProps,
  GetResourceListItemResponse
} from '@fastgpt/global/common/parentFolder/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import dynamic from 'next/dynamic';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import { useContextSelector } from 'use-context-selector';
import { debounce } from 'lodash';

import localFont from 'next/font/local';

const ysbthFont = localFont({
  src: [
    {
      path: './优设标题黑.ttf',
      weight: 'normal',
      style: 'normal'
    }
  ],
  variable: '--ysbthFont'
});

const SelectOneResource = dynamic(() => import('@/components/common/folder/SelectOneResource'));

const SliderApps = ({ apps, activeAppId }: { apps: AppListItemType[]; activeAppId: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isTeamChat = router.pathname === '/chat/team';

  const showRouteToAppDetail = useContextSelector(ChatItemContext, (v) => v.showRouteToAppDetail);

  const [searchFlag, setSearchFlag] = useState<boolean>(false);
  const [allFolderList, setAllFolderList] = useState<any[]>([]);
  const [searchKey, setSearchKey] = useState<any>(''); // 搜索关键字
  const [allAppList, setAllAppList] = useState<any[]>([]); // 所有应用列表，包括文件夹和应用

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

  useEffect(() => {
    initAllApps();
  }, []);

  const buildFilteredTree = (data: any, targetId?: string) => {
    const map = new Map();
    const tree: any = [];

    // 先创建一个映射，方便快速查找节点
    data.forEach((item: any) => {
      map.set(item._id, { ...item, children: [] });
    });

    let targetItem: any = null; // 要置顶的第二层数据
    let targetParent: any = null; // 目标第二层数据的父节点（第一层）

    // 遍历数据，构造树结构
    data.forEach((item: any) => {
      if (item.parentId && map.has(item.parentId)) {
        const parent = map.get(item.parentId);

        // 仅允许第一层的 type === 'folder'
        if (!parent.parentId && parent.type === 'folder' && item.type !== 'folder') {
          parent.children.push(map.get(item._id));

          if (item._id === targetId) {
            targetItem = map.get(item._id);
            targetParent = parent;
          }
        }
      } else {
        // 只有第一层 type === 'folder' 的数据才能作为根节点
        if (item.type === 'folder') {
          tree.push(map.get(item._id));
        }
      }
    });

    // 如果找到了目标项，则将目标项置顶
    if (targetItem && targetParent) {
      // 将目标父节点从第一层中移除并置顶
      const parentIndex = tree.indexOf(targetParent);
      if (parentIndex > -1) {
        tree.splice(parentIndex, 1);
      }
      tree.unshift(targetParent); // 将父节点置顶

      // 将目标项从目标父节点的 children 中移除并置顶
      const childIndex = targetParent.children.indexOf(targetItem);
      if (childIndex > -1) {
        targetParent.children.splice(childIndex, 1);
      }
      targetParent.children.unshift(targetItem); // 将子节点置顶
    }

    return tree;
  };

  const initAllApps = async () => {
    const resp = await getAllMyApps({
      username: 'root'
    });
    setAllAppList(resp);
    const tree = buildFilteredTree(resp, activeAppId);
    setAllFolderList(tree);
  };

  const searchApps = useMemo(() => {
    if (searchKey) {
      setSearchFlag(true);
      return allAppList.filter((item) => item.name.includes(searchKey));
    } else {
      setSearchFlag(false);
      return [];
    }
  }, [searchKey, allAppList]);

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

  const getAppCardLogo = (data: any) => {
    if (data.avatar.startsWith('core/')) {
      return `/imgs/${data.avatar}.svg`;
    } else if (data.avatar.startsWith('/api/')) {
      return `${location.origin}${data.avatar}`;
    }
    return data.avatar;
  };

  return (
    // <Flex flexDirection={'column'} h={'100%'}>
    <Flex flexDirection={'column'} h={'100%'} bgColor={'#ffffff'} className={ysbthFont.variable}>
      {showRouteToAppDetail && (
        <>
          {/* <Box mt={4} px={4}> */}
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
              // py={2}
              // px={3}
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
                    src="/icon/logo.svg"
                    borderRadius="full"
                    boxSize="32px"
                    alt="Dan Abramov"
                  />
                  <Box fontSize={30} fontFamily={'var(--ysbthFont)'} color={'#C01920'}>
                    {'朔风智语'}
                  </Box>
                </Flex>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="tel"
                    placeholder="搜索智能体"
                    backgroundColor={'#F1F2F3'}
                    onChange={(e) => setSearchKey(e.target?.value)}
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

      {/* {!isTeamChat && !searchFlag && (
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
      )} */}

      {/* <Box flex={'1 0 0'} px={4} h={0} overflow={'overlay'}>
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
            {...(item._id === activeAppId
              ? {
                bg: 'white',
                boxShadow: 'md',
                color: 'primary.600'
              }
              : {
                _hover: {
                  bg: 'myGray.200'
                },
                onClick: () => onChangeApp(item._id)
              })}
          >
            <Avatar src={item.avatar} w={'1.5rem'} borderRadius={'md'} />
            <Box ml={2} className={'textEllipsis'}>
              {item.name}
            </Box>
          </Flex>
        ))}
      </Box> */}

      {!searchFlag && (
        <Box flex={'1 0 0'} px={0} h={0} overflow={'overlay'}>
          <Accordion defaultIndex={[0]} allowMultiple>
            {allFolderList.map((item, index) => {
              return (
                <AccordionItem key={item['_id']} border={'none'}>
                  <h2>
                    <AccordionButton>
                      <Box
                        as="span"
                        flex="1"
                        textAlign="left"
                        fontSize={16}
                        fontWeight={'bold'}
                        color={'#3D3D3D'}
                      >
                        {item.name}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {item.children &&
                      item.children.map((subItem: any) => (
                        <Flex
                          key={subItem._id}
                          py={2}
                          px={3}
                          mb={3}
                          cursor={'pointer'}
                          borderRadius={'md'}
                          alignItems={'center'}
                          fontSize={'sm'}
                          boxSizing={'border-box'}
                          {...(subItem._id === activeAppId
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
                                onClick: () => onChangeApp(subItem._id)
                              })}
                        >
                          {/* <Avatar src={subItem.avatar} w={6} borderRadius={'md'} color='black' /> */}
                          <Image
                            objectFit={'contain'}
                            boxSize={8}
                            borderRadius={'md'}
                            alt={''}
                            src={getAppCardLogo(subItem)}
                          />
                          <Flex flexDir={'column'} gap={2} w={'calc(100% - 20px)'}>
                            <Box ml={2} className={'textEllipsis'} fontSize={'14px'}>
                              {subItem.name}
                            </Box>
                            <Box
                              ml={2}
                              className={'textEllipsis'}
                              fontSize={'12px'}
                              color={'#4B5563'}
                            >
                              {subItem.intro ? subItem.intro : t('common.no_intro')}
                            </Box>
                          </Flex>
                        </Flex>
                      ))}
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
          {/* {apps.map((item) => (
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
          ))} */}
        </Box>
      )}
    </Flex>
  );
};

export default React.memo(SliderApps);
