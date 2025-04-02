import 
  React, { 
    useEffect, 
    useRef 
  } from 'react';
import { 
  Avatar, 
  Popover, 
  Button, 
  Modal 
} from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  UnlockOutlined 
} from '@ant-design/icons';
import useUserStore from '@/stores/user';
import useLayoutStore from '@/stores/layout';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../forms/LoginForm/LoginFrom';
import RegisterForm from '../forms/RegisterForm/RegisterForm';
import ForgotPasswordForm from '../forms/ForgotPasswordForm/ForgotPasswordForm';
import './AuthPopover.css';

const AuthPopoverComponent: React.FC = () => {
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = userStore.isLoggedIn();
  const isInDashboard = location.pathname.includes('dashboard');
  const label = isInDashboard ? '返回首页' : '进入后台';

  const goIndexOrToDashboard = () => {
    navigate(isInDashboard ? '/' : '/dashboard');
  };

  const popoverRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        layoutStore.setState({ popoverVisible: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [layoutStore]);

  const loggedInContent = (
    <div className="logged-in-content" ref={popoverRef}>
      <div className="welcome-message">欢迎回来，{userStore.userInfo.username}！</div>
      <div className="user-info">
        <Avatar size={64} src={userStore.userInfo.avatar} />
        <div className="username">{userStore.userInfo.username}</div>
        <div className="address">{userStore.userInfo.address}</div>
      </div>
      <div className="uuid">UUID：{userStore.userInfo.uuid}</div>
      <div className="signature">签名：{userStore.userInfo.signature}</div>
      <div className="action-buttons">
        <Button type="primary" onClick={() => userStore.loginOut(navigate)}>
          退出登录
        </Button>
        <Button type="default" onClick={goIndexOrToDashboard}>
          {label}
        </Button>
      </div>
    </div>
  );

  const notLoggedInContent = (
    <div className="not-logged-in-content" ref={popoverRef}>
      <div className="title">请登录以获取完整的功能体验。</div>
      <div className="auth-buttons">
        <Button
          type="primary"
          icon={<UserOutlined />}
          onClick={() => layoutStore.setState({ loginVisible: true })}
        >
          登录
        </Button>
        <Button
          type="default"
          icon={<EditOutlined />}
          onClick={() => layoutStore.setState({ registerVisible: true })}
        >
          注册
        </Button>
        <Button
          type="link"
          icon={<UnlockOutlined />}
          onClick={() => layoutStore.setState({ forgotPasswordVisible: true })}
        >
          找回密码
        </Button>
      </div>
    </div>
  );

  return (
    <div className="auth-popover">
      <Popover
        content={isLoggedIn ? loggedInContent : notLoggedInContent}
        trigger="click"
        placement="bottom"
        open={layoutStore.popoverVisible}
        className="auth-popover-overlay" // 使用 className 替代 overlayClassName
      >
        <Avatar
          size={36}
          src={isLoggedIn ? userStore.userInfo.avatar : ''}
          icon={isLoggedIn ? undefined : <UserOutlined />}
          onClick={() => layoutStore.setState({ popoverVisible: !layoutStore.popoverVisible })}
        />
      </Popover>

      <Modal
        title="登录"
        open={layoutStore.loginVisible}
        onCancel={() => layoutStore.setState({ loginVisible: false })}
        footer={null}
      >
        <LoginForm />
      </Modal>

      <Modal
        title="注册"
        open={layoutStore.registerVisible}
        onCancel={() => layoutStore.setState({ registerVisible: false })}
        footer={null}
      >
        <RegisterForm />
      </Modal>

      <Modal
        title="找回密码"
        open={layoutStore.forgotPasswordVisible}
        onCancel={() => layoutStore.setState({ forgotPasswordVisible: false })}
        footer={null}
      >
        <ForgotPasswordForm />
      </Modal>
    </div>
  );
};

export default AuthPopoverComponent;