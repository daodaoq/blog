import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tag, Button } from 'antd';
import useTagStore from '@/stores/tag';

const DashboardTag: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tags, removeTag } = useTagStore();

  // 处理关闭标签
  const handleClose = (tagName: string) => {
    const currentTags = tags;

    // 如果要删除的 tag 不是当前路由，则直接删除
    if (tagName !== location.pathname.split('/').pop()) {
      removeTag(tagName);
      return;
    }

    // 如果要删除的 tag 是当前路由，先找到要删除的 tag 的索引
    const index = currentTags.findIndex((tag) => tag.name === tagName);

    // 如果找到了该 tag
    if (index !== -1) {
      // 先删除该 tag
      removeTag(tagName);

      // 计算要跳转的上一个 tag 的名称
      const previousTag = index > 0 ? currentTags[index - 1].name : null;

      // 跳转到上一个 tag 或默认路由
      if (previousTag) {
        navigate(`/${previousTag}`);
      } else {
        navigate('/dashboard');
      }
    }
  };

  // 处理点击标签
  const handleTag = (tagName: string) => {
    navigate(`/${tagName}`);
  };

  // 关闭所有标签
  const closeAllTags = () => {
    useTagStore.setState({
      tags: [
        {
          title: '主页',
          name: 'dashboard',
        },
      ],
    });
    navigate('/dashboard');
  };

  return (
    <div className="dashboard-tag">
      {tags.map((tag) => (
        <Tag
          key={tag.name}
          closable={tag.name !== 'home'}
          onClose={() => handleClose(tag.name)}
          onClick={() => handleTag(tag.name)}
          color={location.pathname.split('/').pop() === tag.name ? 'blue' : 'default'}
        >
          {tag.title}
        </Tag>
      ))}
      {/* 只有在 tags 长度大于 1 时才显示“关闭全部”按钮 */}
      {tags.length > 0 && (
        <Button className="close-button" size="small" onClick={closeAllTags}>
          关闭全部
        </Button>
      )}
    </div>
  );
};

export default DashboardTag;