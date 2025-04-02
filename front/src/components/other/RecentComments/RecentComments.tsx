import React, { useEffect } from 'react';
import { Card, Row } from 'antd';
import useLayoutStore from '@/stores/layout';  // 引入 zustand store
import CommentItem from '@/components/common/CommentItem/CommentItem';  // 引入评论项组件
import { Comment, commentNew } from '@/api/comment';

const RecentComments: React.FC = () => {
  const layoutStore = useLayoutStore();  // 获取 Zustand store
  const [comments, setComments] = React.useState<Comment[]>([]);

  // 获取最新评论信息
  const getRecentCommentInfo = async () => {
    const res = await commentNew();
    if (res.code === 0) {
      setComments(res.data);
    }
  };

  // 在组件加载时获取最新评论
  useEffect(() => {
    getRecentCommentInfo();
  }, []);

  // 监听是否需要刷新评论列表
  useEffect(() => {
    if (layoutStore.shouldRefreshCommentList) {
      getRecentCommentInfo();
      layoutStore.setState({ shouldRefreshCommentList: false });  // 设置状态
    }
  }, [layoutStore.shouldRefreshCommentList, layoutStore]);

  return (
    <Card className="recent-comments">
      <Row className="title">最新评论</Row>
      <CommentItem comments={comments} />
    </Card>
  );
};

export default RecentComments;
