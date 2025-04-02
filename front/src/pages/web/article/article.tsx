import 
  React, { 
    useEffect, 
    useState, 
    useRef 
  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Row, 
  Button, 
  Input, 
  message, 
  Tag 
} from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  EyeOutlined, 
  MessageOutlined 
} from '@ant-design/icons';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 代码高亮样式
import { 
  articleInfoByID, 
  articleLike, 
  articleIsLike 
} from '@/api/article';
import { commentCreate, commentInfoByArticleID } from '@/api/comment';
import useUserStore from '@/stores/user';
import WebNavbar from '@/components/layout/WebNavbar/WebNavbar';
import CommentItem from '@/components/common/CommentItem/CommentItem';
import './article.css';

interface ArticleInfo {
  created_at: string;
  updated_at: string;
  cover: string;
  title: string;
  keyword: string;
  category: string;
  tags: string[];
  abstract: string;
  content: string;
  views: number;
  comments: number;
  likes: number;
}

interface User {
  uuid: string;
  username: string;
  email: string;
  openid: string;
  avatar: string;
  address: string;
  signature: string;
  role_id: number;
  register: string;
  freeze: boolean;
  id: number;
  created_at: Date;
  updated_at: Date;
}

interface Comment {
  id: number;
  article_id: string;
  p_id: number | null;
  children: Comment[];
  user_uuid: string;
  user: User;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// 在组件外部初始化 markdown-it，避免每次渲染都重新初始化
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (error) {
        console.error('代码高亮失败:', error);
      }
    }
    return ''; // 使用默认的高亮
  },
});

const ArticlePage: React.FC = () => {
  const [articleInfo, setArticleInfo] = useState<ArticleInfo>({
    created_at: '',
    updated_at: '',
    cover: '',
    title: '',
    keyword: '',
    category: '',
    tags: [],
    abstract: '',
    content: '',
    views: 0,
    comments: 0,
    likes: 0,
  });

  const [isLike, setIsLike] = useState(false);
  const [content, setContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userStore = useUserStore();

  // 使用 useRef 存储 markdown-it 实例
  const mdRef = useRef(md);

  useEffect(() => {
    const fetchArticleInfo = async () => {
      const res = await articleInfoByID(id!);
      if (res.code === 0) {
        setArticleInfo(res.data);
      } else {
        navigate('/404');
      }
    };

    const fetchIsLikeInfo = async () => {
      if (userStore.isLoggedIn()) {
        const res = await articleIsLike({ article_id: id! });
        if (res.code === 0) {
          setIsLike(res.data);
        }
      }
    };

    const getArticleCommentsInfo = async () => {
      const res = await commentInfoByArticleID(id!);
      if (res.code === 0) {
        const formattedComments = res.data.map((comment: Comment) => ({
          ...comment,
          created_at: new Date(comment.created_at),
          updated_at: new Date(comment.updated_at),
        }));

        setComments(formattedComments);
      }
    };

    fetchArticleInfo();
    fetchIsLikeInfo();
    getArticleCommentsInfo();
  }, [id, navigate, userStore]);

  const handleLike = async () => {
    const res = await articleLike({ article_id: id! });
    if (res.code === 0) {
      message.success(res.msg);
      setArticleInfo((prev) => ({
        ...prev,
        likes: prev.likes + (isLike ? -1 : 1),
      }));
      setIsLike(!isLike);
    }
  };

  const handleCommentSubmit = async () => {
    if (!content.trim()) {
      message.warning('评论内容不能为空');
      return;
    }

    const res = await commentCreate({ article_id: id!, content, p_id: 0 });
    if (res.code === 0) {
      message.success('评论成功！');
      setContent('');
      const updatedComments = await commentInfoByArticleID(id!);
      if (updatedComments.code === 0) {
        const formattedComments = updatedComments.data.map((comment: Comment) => ({
          ...comment,
          created_at: new Date(comment.created_at),
          updated_at: new Date(comment.updated_at),
        }));

        setComments(formattedComments);
      }
    } else {
      message.error(res.msg);
    }
  };

  return (
    <>
      <WebNavbar />
      <div className="article">
        <div className="container">
          <div className="el-main">
            <div className="info">
              <h1 className="title">{articleInfo.title}</h1>
              <p className="time">发布：{articleInfo.created_at} | 更新：{articleInfo.updated_at}</p>
              <Row className="stats">
                <span><EyeOutlined /> 浏览量: {articleInfo.views}</span>
                <span><StarOutlined /> 点赞数: {articleInfo.likes}</span>
                <span><MessageOutlined /> 评论数: {articleInfo.comments}</span>
              </Row>
              <Row className="category">类别：{articleInfo.category}</Row>
              <Row className="tags">
                标签：{articleInfo.tags.map((item) => <Tag key={item}>{item}</Tag>)}
              </Row>
              {/* 文章概述区域 */}
              <div className="abstract-container">
                <p className="abstract">简介：{articleInfo.abstract}</p>
              </div>
            </div>

            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: mdRef.current.render(articleInfo.content) }}
            />

            <div className="comment">
              <Input.TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你的评论..."
                maxLength={320}
              />
              <div className="operation">
                <Button type={isLike ? 'primary' : 'default'} icon={isLike ? <StarFilled /> : <StarOutlined />} onClick={handleLike}>
                  {articleInfo.likes} 赞
                </Button>
                <Button type="primary" onClick={handleCommentSubmit}>发表</Button>
              </div>
            </div>

            <div className="comment-list">
              <CommentItem comments={comments} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticlePage;