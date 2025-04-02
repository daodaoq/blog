import 
  React, { 
    useState, 
    useEffect 
  } from 'react';
import {
  BankOutlined,
  EditOutlined,
  FormOutlined,
  GithubOutlined,
  PullRequestOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import UserPopover from '../../common/AuthPopover/AuthPopover';
import './WebNavbar.css';

type MenuItem = Required<MenuProps>['items'][number];

// 菜单栏数组
const items: MenuItem[] = [
  {
    label: '首页',
    key: 'index',
    icon: <BankOutlined />,
  },
  {
    label: '文章',
    key: 'article',
    icon: <EditOutlined />,
  },
  {
    label: '留言',
    key: 'message',
    icon: <FormOutlined />,
  },
  {
    label: '友链',
    key: 'friend_link',
    icon: <PullRequestOutlined />,
  },
  {
    label: 'Github',
    key: 'github',
    icon: <GithubOutlined />,
    className: 'github-menu-item', // 添加自定义类名
  },
];

// 定义导航组件
const WebNavbar: React.FC = () => {
  const [current, setCurrent] = useState('index');
  const location = useLocation();
  const navigate = useNavigate();

  // 更新当前选中的菜单项，确保每次路径变化时都能同步
  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === '/') {
      setCurrent('index');
    } else if (pathname === '/feedback') {
      setCurrent('message');
    } else if (/^\/article\/[a-zA-Z0-9_]+/.test(pathname) || pathname === '/article') {
      setCurrent('article');
    } else if (pathname === '/friend-link') {
      setCurrent('friend_link');
    }
  }, [location.pathname]);

  // onClick 逻辑，点击后直接跳转并更新菜单项的高亮
  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);

    // 如果点击的是 GitHub，直接打开新标签页，不更新高亮状态
    if (e.key === 'github') {
      window.open('https://github.com/daodaoq', '_blank'); // 在新标签页打开 GitHub
      return; // 直接返回，不执行后续逻辑
    }

    setCurrent(e.key); // 更新当前高亮菜单项

    // 根据 key 跳转到对应路由
    switch (e.key) {
      case 'message':
        navigate('/feedback');
        break;
      case 'index':
        navigate('/');
        break;
      case 'article':
        navigate('/article');
        break;
      case 'friend_link':
        navigate('/friend-link');
        break;
      default:
        break;
    }
  };

  return (
    <div className="web-navbar-container">
      <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={items} />
      <div className="user-popover-wrapper">
        <UserPopover />
      </div>
    </div>
  );
};

export default WebNavbar;