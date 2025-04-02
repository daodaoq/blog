import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Button 
} from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  StarOutlined,
  MessageOutlined,
  MonitorOutlined,
  SettingOutlined,
  FileTextOutlined,
  PictureOutlined,
  LinkOutlined,
  LoginOutlined,
  FormOutlined,
} from '@ant-design/icons';
import useLayoutStore from '@/stores/layout';
import useTagStore from '@/stores/tag';
import useUserStore from '@/stores/user';
import './DashboardMenu.css';

const { Sider } = Layout;

interface MenuItem {
  title: string;
  name: string;
  icon: React.ReactNode;
  subItems?: MenuItem[];
  admin_role?: boolean;
}

const menuList: MenuItem[] = [
  {
    title: '主页',
    name: '',
    icon: <HomeOutlined />,
  },
  {
    title: '个人中心',
    name: 'user-center',
    icon: <MonitorOutlined />,
    subItems: [
      {
        title: '我的信息',
        name: 'user-info',
        icon: <UserOutlined />,
      },
      {
        title: '我的收藏',
        name: 'user-star',
        icon: <StarOutlined />,
      },
      {
        title: '我的评论',
        name: 'user-comment',
        icon: <MessageOutlined />,
      },
      {
        title: '我的留言',
        name: 'user-feedback',
        icon: <FormOutlined />,
      },
    ],
  },
  {
    title: '用户管理',
    name: 'users',
    icon: <UserOutlined />,
    admin_role: true,
    subItems: [
      {
        title: '用户列表',
        name: 'user-list',
        icon: <SettingOutlined />,
      },
    ],
  },
  {
    title: '文章管理',
    name: 'articles',
    icon: <FileTextOutlined />,
    admin_role: true,
    subItems: [
      {
        title: '发布文章',
        name: 'article-publish',
        icon: <FileTextOutlined />,
      },
      {
        title: '文章列表',
        name: 'article-list',
        icon: <FileTextOutlined />,
      },
    ],
  },
  {
    title: '图片管理',
    name: 'images',
    icon: <PictureOutlined />,
    admin_role: true,
    subItems: [
      {
        title: '图片列表',
        name: 'image-list',
        icon: <PictureOutlined />,
      },
    ],
  },
  {
    title: '系统管理',
    name: 'system',
    icon: <SettingOutlined />,
    admin_role: true,
    subItems: [
      {
        title: '留言列表',
        name: 'feedback-list',
        icon: <MessageOutlined />,
      },
      {
        title: '友链列表',
        name: 'friend-link-list',
        icon: <LinkOutlined />,
      },
      {
        title: '登录日志',
        name: 'login-logs',
        icon: <LoginOutlined />,
      },
    ],
  },
];

const DashboardMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapse, setIsCollapse } = useLayoutStore();
  const { addTag } = useTagStore();
  const { isAdmin } = useUserStore();

  const icon = useMemo(() => (isCollapse ? <HomeOutlined /> : <SettingOutlined />), [isCollapse]);

  const handleCollapse = () => {
    setIsCollapse(!isCollapse);
  };

  // 生成单层菜单项的路径
  const generatePathForSingleItem = (item: MenuItem) => `/dashboard/${item.name}`;

  // 生成嵌套菜单项的路径
  const generatePathForSubItem = (parentItem: MenuItem, subItem: MenuItem) =>
    `/dashboard/${parentItem.name}/${subItem.name}`;

  // 处理菜单项点击事件
  const handleClick = (path: string, subItem: MenuItem) => {
    // 添加标签
    const newTag = {
      title: subItem.title,
      name: subItem.name,
    };
    addTag(newTag);

    // 导航到对应路径
    navigate(path);
  };

  // 将 menuList 转换为 Ant Design 的 items 格式
  const menuItems = menuList
    .map((item) => {
      if (!item.subItems) {
        // 单层菜单项
        const path = generatePathForSingleItem(item);
        return {
          key: path,
          icon: item.icon,
          label: item.title,
          onClick: () => handleClick(path, item),
        };
      } else if (!item.admin_role || isAdmin()) {
        // 嵌套菜单项
        return {
          key: item.name,
          icon: item.icon,
          label: item.title,
          children: item.subItems.map((subItem) => {
            const path = generatePathForSubItem(item, subItem);
            return {
              key: path,
              icon: subItem.icon,
              label: subItem.title,
              onClick: () => handleClick(path, subItem),
            };
          }),
        };
      }
      return null;
    })
    .filter(Boolean); // 过滤掉 null 值

  return (
    <Sider
      collapsible
      collapsed={isCollapse}
      onCollapse={handleCollapse}
      theme="light" // 设置菜单栏为白色主题
    >
      <div className="dashboard-menu">
        <div className="collapse-button">
          <Button type="text" onClick={handleCollapse} icon={icon} />
        </div>
        <Menu
          theme="light" // 设置菜单栏为白色主题
          mode="inline"
          selectedKeys={[location.pathname]} // 当前选中的菜单项
          defaultOpenKeys={menuList
            .filter((item) => item.subItems && location.pathname.includes(item.name))
            .map((item) => item.name)} // 默认展开当前选中的子菜单
          items={menuItems} // 使用 items 属性
        />
      </div>
    </Sider>
  );
};

export default DashboardMenu;