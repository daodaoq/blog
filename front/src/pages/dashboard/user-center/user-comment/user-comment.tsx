import 
  React, { 
    useEffect, 
    useState 
  } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from 'antd';
import CommentItem from '@/components/common/CommentItem/CommentItem';
import { commentInfo, type Comment } from '@/api/comment';
import useLayoutStore from '@/stores/layout';
import './user-comment.css';

const { Title } = Typography;

const UserComment: React.FC = () => {
  const [userCommentTableData, setUserCommentTableData] = useState<Comment[]>([]);
  const { shouldRefreshCommentList, setState } = useLayoutStore();

  // 获取用户评论数据
  const getUserCommentTableData = async () => {
    try {
      const response = await commentInfo();
      if (response.code === 0 && response.data) {
        setUserCommentTableData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch comment data:', error);
    }
  };

  // 初始加载数据
  useEffect(() => {
    getUserCommentTableData();
  }, []);

  // 监听 shouldRefreshCommentList 的变化
  useEffect(() => {
    if (shouldRefreshCommentList) {
      getUserCommentTableData();
      setState({ shouldRefreshCommentList: false }); // 重置为 false
    }
  }, [shouldRefreshCommentList, setState]); // 添加 setState 到依赖数组

  return (
    <div className="user-comment">
      <Title level={4} className="title">
        我的评论
      </Title>

      {userCommentTableData.map((item, index) => (
        <div key={item.id ? `comment-${item.id}` : `comment-index-${index}`} className="table-data">
          <div className="link">
            <Link to={`/article/${item.article_id}`}>{item.article_id}</Link>
          </div>
          <div className="item">
            <CommentItem comments={[item]} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserComment;