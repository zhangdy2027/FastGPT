import React, { useCallback, useState, useEffect, useMemo } from 'react';
import type { BoxProps } from '@chakra-ui/react';
import {
  Flex,
  Box,
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
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { type AppListItemType } from '@fastgpt/global/core/app/type';
import MyDivider from '@fastgpt/web/components/common/MyDivider';
import { useUserStore } from '@/web/support/user/useUserStore';
import UserAvatarPopover from '@/pageComponents/chat/UserAvatarPopover';
import MyBox from '@fastgpt/web/components/common/MyBox';
import MyIcon from '@fastgpt/web/components/common/Icon';
import {
  ChatSidebarPaneEnum,
  DEFAULT_LOGO_BANNER_COLLAPSED_URL,
  DEFAULT_LOGO_BANNER_URL
} from '@/pageComponents/chat/constants';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useContextSelector } from 'use-context-selector';
import { ChatSettingContext } from '@/web/core/chat/context/chatSettingContext';
import { usePathname } from 'next/navigation';
import localFont from 'next/font/local';
import { getAllMyApps } from '@/web/core/app/api';
import { useRouter } from 'next/router';

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

type Props = {
  activeAppId: string;
  apps: AppListItemType[];
};

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const ANIMATION_DURATION = 0.15;
const ANIMATION_EASE = 'easeInOut';
const TEXT_DELAY = 0.1;

const contentVariants = {
  show: {
    opacity: 1,
    transition: { duration: 0.05, delay: 0.02 }
  },
  hide: {
    opacity: 0,
    transition: { duration: 0.05 }
  }
};

const textVariants = {
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.1,
      delay: ANIMATION_DURATION + TEXT_DELAY,
      ease: 'easeOut'
    }
  },
  hide: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.001,
      ease: 'easeIn'
    }
  }
};

// 图标快速动画（无延迟）
const iconVariants = {
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.1,
      delay: 0.05,
      ease: 'easeOut'
    }
  },
  hide: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.1,
      ease: 'easeIn'
    }
  }
};

// 通用动画容器
const AnimatedSection: React.FC<
  {
    show: boolean;
    children: React.ReactNode;
    variant?: 'content' | 'text' | 'icon';
  } & BoxProps
> = ({ show, children, variant = 'content', ...props }) => {
  const getVariants = () => {
    switch (variant) {
      case 'text':
        return textVariants;
      case 'icon':
        return iconVariants;
      default:
        return contentVariants;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <MotionBox
          variants={getVariants()}
          initial="hide"
          animate="show"
          exit="hide"
          layout={false}
          {...props}
        >
          {children}
        </MotionBox>
      )}
    </AnimatePresence>
  );
};

// 文字动画组件
type AnimatedTextProps = {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
};

const AnimatedText: React.FC<AnimatedTextProps> = ({ show, children, className, ...props }) => (
  <AnimatePresence mode="wait">
    {show && (
      <MotionBox
        variants={textVariants}
        initial="hide"
        animate="show"
        exit="hide"
        className={className}
        layout={false}
        {...props}
      >
        {children}
      </MotionBox>
    )}
  </AnimatePresence>
);

const LogoSection = () => {
  const isCollapsed = useContextSelector(ChatSettingContext, (v) => v.collapse === 1);
  const logos = useContextSelector(ChatSettingContext, (v) => v.logos);
  const isHomeActive = useContextSelector(
    ChatSettingContext,
    (v) => v.pane === ChatSidebarPaneEnum.HOME
  );
  const onTriggerCollapse = useContextSelector(ChatSettingContext, (v) => v.onTriggerCollapse);
  const wideLogoSrc = logos.wideLogoUrl;
  const squareLogoSrc = logos.squareLogoUrl;

  return (
    <MotionFlex
      mt={4}
      py={2}
      alignItems="center"
      animate={{ paddingLeft: isCollapsed ? 0 : 12 }}
      transition={{ duration: ANIMATION_DURATION, ease: ANIMATION_EASE }}
      justifyContent={isCollapsed ? 'center' : 'space-between'}
    >
      <AnimatedSection show={!isCollapsed}>
        <Image
          w="135px"
          h="33px"
          loading="eager"
          alt="FastGPT slogan"
          src={wideLogoSrc || DEFAULT_LOGO_BANNER_URL}
          fallbackSrc={DEFAULT_LOGO_BANNER_URL}
        />
      </AnimatedSection>

      <AnimatedSection show={isCollapsed}>
        <Flex justifyContent="center" w="100%">
          <Image
            w="33px"
            h="33px"
            src={squareLogoSrc || DEFAULT_LOGO_BANNER_COLLAPSED_URL}
            fallbackSrc={DEFAULT_LOGO_BANNER_COLLAPSED_URL}
            alt="FastGPT logo"
            loading="eager"
          />
        </Flex>
      </AnimatedSection>

      <AnimatedSection show={!isCollapsed}>
        <Flex pr={3}>
          <MyIcon
            p={1}
            cursor={'pointer'}
            borderRadius={'8px'}
            _hover={{ bg: 'myGray.200' }}
            name={'core/chat/sidebar/fold'}
            color={isHomeActive ? 'primary.500' : 'myGray.400'}
            onClick={onTriggerCollapse}
          />
        </Flex>
      </AnimatedSection>
    </MotionFlex>
  );
};

const CustomLogoSection = (props: any) => {
  const pamras = new URLSearchParams(location.search);
  const isEmbed = pamras.get('embed');

  return (
    <Box
      mt={0}
      p={3}
      className={ysbthFont.variable}
      background={'linear-gradient(180deg, rgba(255, 0, 0, 0.06) 0%, rgba(255, 0, 0, 0) 100%)'}
    >
      <Flex alignItems={'center'} borderRadius={'md'}>
        <Flex flexDirection={'column'} gap={4}>
          {!isEmbed && (
            <Flex alignItems={'center'} justifyContent={'center'} gap={3}>
              <Image src="/icon/logo.svg" borderRadius="full" boxSize="32px" alt="Dan Abramov" />
              <Box fontSize={30} fontFamily={'var(--ysbthFont)'} color={'#C01920'}>
                {'朔风智语'}
              </Box>
            </Flex>
          )}

          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              type="tel"
              placeholder="搜索智能体"
              backgroundColor={'#F1F2F3'}
              onChange={(e) => props.setSearchKey(e.target?.value)}
            />
          </InputGroup>
        </Flex>
      </Flex>
    </Box>
  );
};

const ActionButton: React.FC<{
  text?: string;
  isActive?: boolean;
  isCollapsed: boolean;
  icon: Parameters<typeof MyIcon>[0]['name'];
  onClick: () => void;
}> = ({ icon, text, isActive = false, isCollapsed, onClick }) => {
  return (
    <Flex
      p={2}
      flex={1}
      cursor={'pointer'}
      borderRadius={'8px'}
      alignItems={'center'}
      justifyContent={isCollapsed ? 'center' : 'flex-start'}
      {...(isActive
        ? {
            bg: 'primary.100',
            color: 'primary.600'
          }
        : {
            bg: 'transparent',
            color: 'myGray.500',
            _hover: {
              bg: isCollapsed ? 'myGray.200' : 'primary.100'
            }
          })}
      onClick={onClick}
    >
      <MyIcon w="20px" h="20px" name={icon} viewBox="0 0 20 20" mr={isCollapsed ? 0 : 2} />
      <AnimatedText
        show={!isCollapsed && !!text}
        fontSize="sm"
        fontWeight={500}
        flexShrink={0}
        whiteSpace="nowrap"
      >
        {text}
      </AnimatedText>
    </Flex>
  );
};

const NavigationSection = () => {
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();

  const isEnableHome = useContextSelector(
    ChatSettingContext,
    (v) => v.chatSettings?.enableHome ?? true
  );
  const isCollapsed = useContextSelector(ChatSettingContext, (v) => v.collapse === 1);
  const onTriggerCollapse = useContextSelector(ChatSettingContext, (v) => v.onTriggerCollapse);
  const isHomeActive = useContextSelector(
    ChatSettingContext,
    (v) => v.pane === ChatSidebarPaneEnum.HOME
  );
  const isTeamAppsActive = useContextSelector(
    ChatSettingContext,
    (v) => v.pane === ChatSidebarPaneEnum.TEAM_APPS
  );
  const isFavouriteAppsActive = useContextSelector(
    ChatSettingContext,
    (v) => v.pane === ChatSidebarPaneEnum.FAVORITE_APPS
  );
  const handlePaneChange = useContextSelector(ChatSettingContext, (v) => v.handlePaneChange);

  return (
    <Flex mt={4} flexDirection={'column'} gap={1} px={4}>
      <AnimatedSection show={isCollapsed}>
        <ActionButton isCollapsed icon="core/chat/sidebar/expand" onClick={onTriggerCollapse} />
      </AnimatedSection>

      <AnimatePresence mode="wait">
        {isCollapsed ? (
          <AnimatedSection show={true}>
            <Flex flexDir="column" gap={2}>
              {feConfigs.isPlus && (
                <>
                  {isEnableHome && (
                    <ActionButton
                      icon="core/chat/sidebar/home"
                      isCollapsed={true}
                      isActive={isHomeActive}
                      onClick={() => handlePaneChange(ChatSidebarPaneEnum.HOME)}
                    />
                  )}

                  <ActionButton
                    icon="core/chat/sidebar/star"
                    isCollapsed={true}
                    isActive={isFavouriteAppsActive}
                    onClick={() => handlePaneChange(ChatSidebarPaneEnum.FAVORITE_APPS)}
                  />
                </>
              )}

              <ActionButton
                icon="common/app"
                isCollapsed={true}
                isActive={isTeamAppsActive}
                onClick={() => handlePaneChange(ChatSidebarPaneEnum.TEAM_APPS)}
              />
            </Flex>
          </AnimatedSection>
        ) : (
          <AnimatedSection show={true}>
            <Flex flexDir="column" gap={2}>
              {feConfigs.isPlus && (
                <>
                  {isEnableHome && (
                    <ActionButton
                      icon="core/chat/sidebar/home"
                      text={t('chat:sidebar.home')}
                      isCollapsed={false}
                      isActive={isHomeActive}
                      onClick={() => handlePaneChange(ChatSidebarPaneEnum.HOME)}
                    />
                  )}

                  <ActionButton
                    icon="core/chat/sidebar/star"
                    text={t('chat:sidebar.favourite_apps')}
                    isCollapsed={false}
                    isActive={isFavouriteAppsActive}
                    onClick={() => handlePaneChange(ChatSidebarPaneEnum.FAVORITE_APPS)}
                  />
                </>
              )}

              <ActionButton
                icon="common/app"
                text={t('chat:sidebar.team_apps')}
                isCollapsed={false}
                isActive={isTeamAppsActive}
                onClick={() => handlePaneChange(ChatSidebarPaneEnum.TEAM_APPS)}
              />
            </Flex>
          </AnimatedSection>
        )}
      </AnimatePresence>
    </Flex>
  );
};

const BottomSection = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { feConfigs } = useSystemStore();
  const isProVersion = !!feConfigs.isPlus;

  const { userInfo } = useUserStore();
  const isLoggedIn = !!userInfo;
  const avatar = userInfo?.avatar;
  const isAdmin = !!userInfo?.team.permission.hasManagePer;
  const isShare = pathname === '/chat/share';

  const isCollapsed = useContextSelector(ChatSettingContext, (v) => v.collapse === 1);
  const isSettingActive = useContextSelector(
    ChatSettingContext,
    (v) => v.pane === ChatSidebarPaneEnum.SETTING
  );
  const onSettingClick = useContextSelector(ChatSettingContext, (v) => v.handlePaneChange);

  return (
    <MotionBox mt={'auto'} px={3} py={4} layout={false}>
      <MotionFlex
        flexDirection={isCollapsed ? 'column' : 'row'}
        alignItems={'center'}
        justifyContent={isCollapsed ? 'center' : 'space-between'}
        gap={isCollapsed ? 3 : 0}
        layout={false}
        h={isCollapsed ? 'auto' : '40px'}
        minH="40px"
      >
        {isAdmin && isProVersion && !isShare && (
          <MotionBox
            order={isCollapsed ? 1 : 2}
            layout={false}
            w="40px"
            h="40px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              _hover={{ bg: 'myGray.200' }}
              bg={isSettingActive ? 'myGray.200' : 'transparent'}
              borderRadius={'8px'}
              p={2}
              cursor={'pointer'}
              w="40px"
              h="40px"
              alignItems="center"
              justifyContent="center"
              onClick={() => onSettingClick(ChatSidebarPaneEnum.SETTING)}
            >
              <MyIcon
                w={'20px'}
                h={'20px'}
                name={'common/setting'}
                fill={isSettingActive ? 'primary.500' : 'myGray.400'}
              />
            </Flex>
          </MotionBox>
        )}

        <MotionBox
          order={isCollapsed ? 2 : 1}
          layout={false}
          w={isCollapsed ? '40px' : '100%'}
          h="40px"
          display="flex"
          alignItems="center"
          justifyContent={'flex-start'}
          maxW={isCollapsed ? 'fit-content' : 'calc(100% - 52px)'}
        >
          {isLoggedIn ? (
            <UserAvatarPopover
              isCollapsed={isCollapsed}
              placement={isCollapsed ? 'right-start' : 'top-end'}
            >
              <Flex
                alignItems="center"
                gap={2}
                w="100%"
                h="40px"
                minW={'40px'}
                justifyContent={'center'}
              >
                <Avatar src={avatar} bg="myGray.200" borderRadius="50%" w={8} h={8} />
                <AnimatedText
                  show={!isCollapsed}
                  className="textEllipsis"
                  flexGrow={1}
                  fontSize={'sm'}
                  fontWeight={500}
                  minW={0}
                >
                  {userInfo?.team?.memberName}
                </AnimatedText>
              </Flex>
            </UserAvatarPopover>
          ) : (
            <Flex
              alignItems="center"
              gap={2}
              w="100%"
              h="40px"
              minW={isCollapsed ? '40px' : 'auto'}
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              cursor="pointer"
              _hover={{ bg: 'myGray.100' }}
              borderRadius="md"
              p={2}
            >
              <Avatar bg="myGray.200" borderRadius="50%" w={8} h={8} />
              <AnimatedText
                show={!isCollapsed}
                flexGrow={1}
                fontWeight={500}
                color="myGray.600"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                minW={0}
              >
                {t('login:Login')}
              </AnimatedText>
            </Flex>
          )}
        </MotionBox>
      </MotionFlex>
    </MotionBox>
  );
};

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

const getAppCardLogo = (data: any) => {
  if (data.avatar.startsWith('core/')) {
    return `/imgs/${data.avatar}.svg`;
  } else if (data.avatar.startsWith('/api/')) {
    return `${location.origin}${data.avatar}`;
  }
  return data.avatar;
};

const ChatSlider = ({ apps, activeAppId }: Props) => {
  const { t } = useTranslation();
  const [searchKey, setSearchKey] = useState<string>(''); // 搜索关键字
  const { userInfo } = useUserStore();
  const router = useRouter();
  const [allAppList, setAllAppList] = useState<any[]>([]); // 所有应用列表，包括文件夹和应用
  const [allFolderList, setAllFolderList] = useState<any[]>([]);
  const [searchFlag, setSearchFlag] = useState<boolean>(false);

  const isCollapsed = useContextSelector(ChatSettingContext, (v) => v.collapse === 1);
  const pane = useContextSelector(ChatSettingContext, (v) => v.pane);

  const handlePaneChange = useContextSelector(ChatSettingContext, (v) => v.handlePaneChange);

  useEffect(() => {
    initAllApps();
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

  const initAllApps = async () => {
    const resp = await getAllMyApps({
      username: userInfo?.username
    });
    setAllAppList(resp);
    const aId: any = router.query?.appId || activeAppId;
    const tree = buildFilteredTree(resp, aId);
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

  return (
    <MotionFlex
      flexDirection={'column'}
      h={'100%'}
      w={'100%'}
      variants={{
        expanded: {
          transition: { duration: ANIMATION_DURATION, ease: ANIMATION_EASE }
        },
        folded: {
          transition: { duration: ANIMATION_DURATION, ease: ANIMATION_EASE }
        }
      }}
      animate={isCollapsed ? 'folded' : 'expanded'}
      initial={false}
      userSelect={'none'}
      bgColor={'#ffffff'}
    >
      <CustomLogoSection setSearchKey={setSearchKey} />

      {/* <NavigationSection /> */}

      {/* recently used apps */}
      {/* <AnimatedSection show={!isCollapsed} display={'flex'} flexDir={'column'} flex={'1 0 0'}>
        <MyDivider h={1} my={1} mx="16px" w="calc(100% - 32px)" />

        <HStack px={3} my={2} color={'myGray.500'} fontSize={'sm'} justifyContent={'space-between'}>
          <Box
            whiteSpace={'nowrap'}
            overflow={'hidden'}
            textOverflow={'ellipsis'}
            pl={2}
            flexGrow={1}
          >
            {t('common:core.chat.Recent use')}
          </Box>
        </HStack>

        <MyBox flex={'1 0 0'} h={0} overflow={'overlay'} px={4} position={'relative'}>
          {apps.map((item) => (
            <Flex
              key={item._id}
              py={2}
              px={2}
              mb={3}
              cursor={'pointer'}
              borderRadius={'md'}
              alignItems={'center'}
              fontSize={'sm'}
              {...(pane === ChatSidebarPaneEnum.RECENTLY_USED_APPS && item._id === activeAppId
                ? { bg: 'primary.100', color: 'primary.600' }
                : {
                    _hover: { bg: 'primary.100' },
                    onClick: () =>
                      handlePaneChange(ChatSidebarPaneEnum.RECENTLY_USED_APPS, item._id)
                  })}
            >
              <Avatar src={item.avatar} w={'1.5rem'} borderRadius={'md'} />
              <Box ml={2} className={'textEllipsis'}>
                {item.name}
              </Box>
            </Flex>
          ))}
        </MyBox>
      </AnimatedSection>

      <BottomSection /> */}

      {searchFlag ? (
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
                  {item.intro ? item.intro : t('no_intro')}
                </Box>
              </Flex>
            </Flex>
          ))}
        </Box>
      ) : (
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
                        color={'#555'}
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
                          <Flex flexDir={'column'} gap={2} w={'150px'}>
                            <Box
                              ml={2}
                              className={'textEllipsis'}
                              fontSize={'14px'}
                              w={'calc(100% - 1.5rem)'}
                            >
                              {subItem.name}
                            </Box>
                            <Box
                              ml={2}
                              className={'textEllipsis'}
                              fontSize={'12px'}
                              color={'#4B5563'}
                              w={'calc(100% - 1.5rem)'}
                            >
                              {subItem.intro ? subItem.intro : t('no_intro')}
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
                  {item.intro ? item.intro : t('no_intro')}
                </Box>
              </Flex>
            </Flex>
          ))} */}
        </Box>
      )}
    </MotionFlex>
  );
};

export default React.memo(ChatSlider);
