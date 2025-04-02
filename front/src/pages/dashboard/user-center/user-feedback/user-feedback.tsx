import 
  React, { 
    useEffect, 
    useState
  } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { feedbackInfo, type Feedback } from '@/api/feedback';
import './user-feedback.css';

const UserFeedback: React.FC = () => {
  const [userFeedbackTableData, setUserFeedbackTableData] = useState<Feedback[]>([]);

  // 格式化时间
  const getTime = (date: Date): string => {
    const time = new Date(date);
    return time.toLocaleString();
  };

  // 获取用户反馈数据
  const getUserFeedbackTableData = async () => {
    const response = await feedbackInfo();
    if (response.code === 0 && response.data) {
      setUserFeedbackTableData(response.data);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    getUserFeedbackTableData();
  }, []);

  // 表格列配置
  const columns: ColumnsType<Feedback> = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (created_at: Date) => getTime(created_at),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
    },
  ];

  return (
    <div className="user-feedback">
      <div className="title">我的留言</div>

      <Table
        dataSource={userFeedbackTableData}
        columns={columns}
        rowKey="id"
        bordered
        pagination={false}
        rowClassName={() => 'feedback-row'}
      />
    </div>
  );
};

export default UserFeedback;