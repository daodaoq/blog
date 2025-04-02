import 
  React, { 
    useState, 
    useCallback 
  } from 'react';
import { 
  Popover, 
  Avatar, 
  Button, 
  Input, 
  message 
} from 'antd';
import useLayoutStore from '@/stores/layout';
import useUserStore from '@/stores/user';
import { 
  Comment, 
  commentCreate, 
  CommentCreateRequest, 
  commentDelete, 
  CommentDeleteRequest 
} from '@/api/comment';
import UserCard from '@/components/widgets/UserCard/UserCard';
import './CommentItem.css'

interface CommentItemProps {
  comments: Comment[];
}

const CommentItem: React.FC<CommentItemProps> = ({ comments }) => {
  const userStore = useUserStore();
  const layoutStore = useLayoutStore();
  const [replyFlag, setReplyFlag] = useState(0);
  const [content, setContent] = useState('');
  const numbers = Array.from({ length: 50 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const getTime = (date: Date): string => {
    const time = new Date(date);
    return time.toLocaleString();
  };

  const submitReply = useCallback(async (item: Comment) => {
    const commentCreateRequest: CommentCreateRequest = {
      article_id: item.article_id,
      p_id: item.id,
      content: content,
    };
    const res = await commentCreate(commentCreateRequest);
    if (res.code === 0) {
      message.success(res.msg);
      layoutStore.setState({ shouldRefreshCommentList: true });
      setReplyFlag(0);
      setContent('');
    }
  }, [content, layoutStore]);

  const handleDelete = useCallback(async (id: number) => {
    const commentDeleteRequest: CommentDeleteRequest = {
      ids: [id],
    };
    const res = await commentDelete(commentDeleteRequest);
    if (res.code === 0) {
      message.success(res.msg);
      layoutStore.setState({ shouldRefreshCommentList: true });
    }
  }, [layoutStore]);

  // 定义一个空的 onUserCardInfoChange 函数，明确指定参数类型
  const handleUserCardInfoChange = () => {
    // 这里可以根据实际需求添加处理逻辑，如果暂时不需要可以留空
    // 若确定后续也不会使用该参数，可以考虑移除它
  };

  return (
    <div className="comment-item">
      {comments.map((item) => (
        <div key={item.id} className="item-card">
          <div className="title">
            <Popover
              content={(
                <UserCard
                  uuid=""
                  userCardInfo={{ uuid: item.user.uuid, username: item.user.username, avatar: item.user.avatar, address: item.user.address, signature: item.user.signature }}
                  onUserCardInfoChange={handleUserCardInfoChange}
                />
              )}
            >
              <Avatar src={item.user.avatar} />
            </Popover>
            <div className="name">
              {item.user.username}
            </div>
            <div className="time">
              {getTime(item.created_at)}
            </div>
          </div>
          {/* 这里假设MdPreview是一个自定义的Markdown预览组件，你需要根据实际情况引入和实现 */}
          <div className="content">
            {/* <MdPreview modelValue={item.content} /> */}
            {item.content}
          </div>
          <div className="footer">
            <div className="button-group">
              {replyFlag === item.id && (
                <>
                  <Button type="primary" onClick={() => submitReply(item)}>确定</Button>
                  <Button onClick={() => { setReplyFlag(0); setContent(''); }}>取消</Button>
                </>
              )}
              {!(replyFlag === item.id) && (
                <Button type="primary" onClick={() => setReplyFlag(item.id)}>回复</Button>
              )}
              {!(replyFlag === item.id) && (
                (item.user_uuid === userStore.userInfo.uuid || userStore.isAdmin()) && (
                  <Button type="primary" onClick={() => handleDelete(item.id)}>删除</Button>
                )
              )}
            </div>
          </div>
          {replyFlag === item.id && (
            <div className="reply">
              <Input.TextArea
                className="comment-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里输入您的回复..."
                maxLength={320}
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
              <div className="comment-tool">
                <Popover
                  content={(
                    <div>
                      {numbers.map((number) => (
                        <img
                          key={number}
                          src={`/emoji/xiaochun_emoji_${number}.png`}
                          alt={`emoji_${number}`}
                          onClick={() => setContent(`${content}![](/emoji/xiaochun_emoji_${number}.png)`)}
                          style={{ height: '50px', width: '50px' }}
                        />
                      ))}
                    </div>
                  )}
                >
                  <Avatar src="/emoji/xiaochun_emoji_01.png" style={{ backgroundColor: 'unset' }} />
                </Popover>
              </div>
            </div>
          )}
          {item.children && item.children.length > 0 && (
            <div className="item-children">
              <CommentItem comments={item.children} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentItem;    