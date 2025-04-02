import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom'; // 引入 useNavigate
import Breadcrumb from '@/components/layout/Breadcrumb/Breadcrumb';
import DashboardMenu from '@/components/layout/DashboardMenu/DashboardMenu';
import AuthPopover from '@/components/common/AuthPopover/AuthPopover';
import useLayoutStore from '@/stores/layout';
import useTagStore from '@/stores/tag';
import './index.css';

const { Header, Sider, Content } = Layout;

const Dashboard: React.FC = () => {
  const { isCollapse, setIsCollapse } = useLayoutStore();
  const { resetTags } = useTagStore();
  // 初始化：菜单栏子菜单关闭，标签页为空
  useEffect(() => {
    setIsCollapse(false); // 菜单栏展开，但子菜单关闭
    resetTags(); // 初始状态标签页为空
  }, [setIsCollapse, resetTags]);

  return (
    <Layout className="dashboard">
      <Sider
        className={`dashboard-sider ${isCollapse ? 'collapsed' : ''}`}
        collapsed={isCollapse}
        collapsedWidth={64}
        width={240}
        theme="light" // 设置菜单栏为白色主题
      >
        <DashboardMenu />
      </Sider>
      <Layout>
        <Header className="dashboard-header">
          <div className="header-top">
            <Breadcrumb />
            <div className="header-top-right">
              <AuthPopover />
            </div>
          </div>
          {/* <DashboardTag /> */}
        </Header>
        <Content className="dashboard-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;