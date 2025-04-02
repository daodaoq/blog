import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import useUserStore from '@/stores/user';
import Index from "@/pages/web/index/index"
import Article from '@/pages/web/article/article';
import Feedback from '@/pages/web/feedback/feedback';
import SearchPage from '@/pages/web/search/search';
import FriendLink from '@/pages/web/friend-link/friend-link';
import Dashboard from '@/pages/dashboard/index';
import Home from '@/pages/dashboard/home/home';
import UserInfo from '@/pages/dashboard/user-center/user-info/user-info';
import UserStar from '@/pages/dashboard/user-center/user-star/user-star';
import UserComment from '@/pages/dashboard/user-center/user-comment/user-comment';
import UserFeedback from '@/pages/dashboard/user-center/user-feedback/user-feedback';
import UserList from '@/pages/dashboard/users/user-list';
import ArticlePublish from '@/pages/dashboard/articles/article-publish/article-publish';
// import CommentList from '@/pages/dashboard/articles/comment-list/comment-list';
import ArticleList from '@/pages/dashboard/articles/article-list/article-list';
import ImageList from '@/pages/dashboard/images/images';
import FeedbackList from '@/pages/dashboard/system/feedback-list/feedback-list';
import FriendLinkList from '@/pages/dashboard/system/friend-link-list/friend-link-list';
import LoginLogs from '@/pages/dashboard/system/login-logs/login-logs';
import NotFound from '@/pages/error/error';

// 权限检查组件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const userStore = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userStore.isLoggedIn()) { // 调用 isLoggedIn 函数
      Modal.warning({
        title: '登录提示',
        content: '登录已过期，需要重新登录，是否跳转到登录页？',
        onOk: () => navigate('/login', { replace: true })
      });
    }
  }, [userStore, navigate]);

  return userStore.isLoggedIn() ? children : null; // 调用 isLoggedIn 函数
};


const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const userStore = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userStore.isAdmin()) {
      message.error('权限不足，请确认您的用户角色是否具备访问该页面的权限。');
      navigate(-1);
    }
  }, [userStore, navigate]);

  return userStore.isAdmin() ? children : null;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/index" element={<Index />} />
      <Route path="article" element={<SearchPage />} />
      <Route path="feedback" element={<Feedback />} />
      <Route path="friend-link" element={<FriendLink />} />
      {/* <Route path="about" element={<About />} /> */}
      <Route path="article/:id" element={<Article />} />

      <Route path="dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      }>
        <Route index element={<Home />} />
        <Route path="user-center/user-info" element={<UserInfo />} />
        <Route path="user-center/user-star" element={<UserStar />} />
        <Route path="user-center/user-comment" element={<UserComment />} />
        <Route path="user-center/user-feedback" element={<UserFeedback />} />
        <Route path="users/user-list" element={<AdminRoute><UserList /></AdminRoute>} />
        <Route path="articles/article-publish" element={<AdminRoute><ArticlePublish /></AdminRoute>} />
        {/* <Route path="articles/comment-list" element={<AdminRoute><CommentList /></AdminRoute>} /> */}
        <Route path="articles/article-list" element={<AdminRoute><ArticleList /></AdminRoute>} />
        <Route path="images/image-list" element={<AdminRoute><ImageList /></AdminRoute>} />
        <Route path="system/feedback-list" element={<AdminRoute><FeedbackList /></AdminRoute>} />
        <Route path="system/friend-link-list" element={<AdminRoute><FriendLinkList /></AdminRoute>} />
        <Route path="system/login-logs" element={<AdminRoute><LoginLogs /></AdminRoute>} />
      </Route>
      <Route path="404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRouter;
