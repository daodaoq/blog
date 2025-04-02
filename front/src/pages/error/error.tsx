import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import './error.css';  // 引入 CSS 文件

const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary">
            <Link to="/">返回首页</Link>
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
