import 
  React, { 
    useEffect, 
    useState, 
    useRef, 
    useCallback 
  } from 'react';
import { 
  Input, 
  Button, 
  message, 
  Card 
} from 'antd';
import { feedbackCreate, feedbackNew } from '@/api/feedback';
import './feedback.css';
import useUserStore from '@/stores/user';
import WebNavbar from '@/components/layout/WebNavbar/WebNavbar';
import anime from 'animejs';

const { TextArea } = Input;

interface FeedbackNew {
  content: string;
  time: string;
}

const Feedback: React.FC = () => {
  const [content, setContent] = useState('');
  const { isLoggedIn } = useUserStore();
  const danmakuContainerRef = useRef<HTMLDivElement>(null);

  // 获取反馈列表
  const getFeedbackNew = useCallback(async () => {
    const res = await feedbackNew();
    console.log(res);
    if (res.code === 0) {
      const list = res.data.map((value) => ({
        content: value.content,
        time: new Date(value.created_at).toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      }));
      animateCards(list); // 动态生成弹幕
    }
  }, []);

  // 提交反馈
  const submitForm = async () => {
    if (!content.trim()) {
      message.warning('留言内容不能为空');
      return;
    }

    if (!isLoggedIn()) {
      message.warning('请先登录后再进行留言');
      return;
    }

    const res = await feedbackCreate({ content });
    if (res.code === 0) {
      message.success(res.msg);
      setContent(''); // 清空输入框
      await getFeedbackNew(); // 刷新反馈列表
    }
  };

  // 动画效果函数
  const animateCards = (list: FeedbackNew[]) => {
    if (danmakuContainerRef.current) {
      danmakuContainerRef.current.innerHTML = ''; // 清空容器

      const danmakuHeight = 40; // 每个弹幕的高度
      const containerHeight = danmakuContainerRef.current.clientHeight; // 容器高度
      const maxDanmakuCount = Math.floor(containerHeight / danmakuHeight); // 最大弹幕数量
      const usedTops: number[] = []; // 记录已使用的 top 值

      // 逐个添加弹幕
      list.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'danmaku-item';
        card.innerHTML = `<div>${item.content} - ${item.time}</div>`; // 直接渲染内容

        // 动态计算 top 值，确保不重叠
        let top = Math.floor(Math.random() * maxDanmakuCount) * danmakuHeight;
        while (usedTops.includes(top)) {
          top = Math.floor(Math.random() * maxDanmakuCount) * danmakuHeight;
        }
        usedTops.push(top);
        card.style.top = `${top}px`;

        danmakuContainerRef.current?.appendChild(card);

        // 延迟逐个弹幕的动画效果
        setTimeout(() => {
          // 使用 anime.js 来启动动画
          const startAnimation = () => {
            anime({
              targets: card,
              translateX: ['0', '-100vw'], // 从右向左移动
              duration: 15000, // 更快的速度
              easing: 'linear',
              opacity: [0.8, 0.5], // 渐变透明度
              complete: () => {
                // 动画完成后，重新设置弹幕位置并再次开始动画
                card.style.transform = 'translateX(100%)'; // 让弹幕从右侧开始
                startAnimation(); // 再次启动动画
              },
            });
          };

          startAnimation(); // 启动动画
        }, index * 1000); // 逐个弹幕显示，间隔 1 秒
      });
    }
  };



  useEffect(() => {
    getFeedbackNew(); // 页面加载时获取并启动弹幕动画
  }, [getFeedbackNew]);

  return (
    <>
      <WebNavbar />
      <div className="feedback-container">
        <Card className="feedback-card">
          <div className="feedback-title">留言墙</div>
          <TextArea
            rows={4}
            value={content}
            maxLength={100}
            showCount
            placeholder="请输入反馈建议"
            onChange={(e) => setContent(e.target.value)}
            className="feedback-input"
          />
          <div className="feedback-tip">
            {isLoggedIn() ? (
              <span>登录成功，您可以留言了！</span>
            ) : (
              <span>请登录后才能进行留言！</span>
            )}
          </div>
          <div className="feedback-buttons">
            <Button type="primary" onClick={submitForm} disabled={!isLoggedIn()}>
              确定
            </Button>
            <Button onClick={() => setContent('')}>取消</Button>
          </div>
        </Card>
        <div className="danmaku-container" ref={danmakuContainerRef}></div>
      </div>
    </>
  );
};

export default Feedback;
