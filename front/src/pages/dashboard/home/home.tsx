import 
  React, { 
    useEffect, 
    useState, 
    useCallback 
  } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Select, 
  Typography 
} from 'antd';
import {
  UserOutlined,
  StarOutlined,
  CommentOutlined,
  MessageOutlined,
} from '@ant-design/icons'; // 引入图标
import useUserStore from '@/stores/user';
import useWebsiteStore from '@/stores/website';
import useTagStore from '@/stores/tag';
import { useNavigate } from 'react-router-dom';
import { userChart } from '@/api/user';
import type { 
  UserChartRequest, 
  UserChartResponse, 
  Entrance 
} from '@/api/user';
import UserActivityChart from '@/components/widgets/UserActivityChart/UserActivityChart';
import './home.css';

const { Text } = Typography;
const { Option } = Select;

const Home: React.FC = () => {
  const userStore = useUserStore();
  const websiteStore = useWebsiteStore();
  const tagStore = useTagStore();
  const navigate = useNavigate();

  const [chart, setChart] = useState<UserChartResponse>({
    date_list: [],
    login_data: [],
    register_data: [],
  });
  const [isShow, setIsShow] = useState(false);
  const [userChartRequest, setUserChartRequest] = useState<UserChartRequest>({
    date: 7,
  });

  const userChartOptions = [
    { value: 7, label: '七天' },
    { value: 30, label: '一个月' },
    { value: 90, label: '三个月' },
    { value: 180, label: '六个月' },
    { value: 365, label: '一年' },
  ];

  const entranceList: Entrance[] = [
    {
      title: '我的信息',
      name: 'user-center/user-info',
      icon: <UserOutlined />, // 使用图标
      type: 'default',
    },
    {
      title: '我的收藏',
      name: 'user-center/user-star',
      icon: <StarOutlined />, // 使用图标
      type: 'default',
    },
    {
      title: '我的评论',
      name: 'user-center/user-comment',
      icon: <CommentOutlined />, // 使用图标
      type: 'default',
    },
    {
      title: '我的反馈',
      name: 'user-center/user-feedback',
      icon: <MessageOutlined />, // 使用图标
      type: 'default',
    },
  ];

  const fetchChartInfo = useCallback(async () => {
    setIsShow(false);
    const res = await userChart(userChartRequest);
    if (res.code === 0) {
      setChart(res.data);
      setIsShow(true);
    }
  }, [userChartRequest]);

  useEffect(() => {
    fetchChartInfo();
  }, [fetchChartInfo]);

  const handleClick = (item: Entrance) => {
    const newTag = {
      title: item.title,
      name: item.name,
    };
    const exists = tagStore.tags.some((tag) => tag.name === newTag.name);
    if (!exists) {
      tagStore.addTag(newTag);
    }
    navigate(item.name);
  };

  return (
    <div className="home">
      <div className="header">
        <Card className="user-card">
          <Row>你好，{userStore.userInfo.username}，今天也要加油啊！</Row>
        </Card>
      </div>

      <div className="content">
        <Col span={14}>
          <Card className="entrance-card">
            <Row className="title">快捷入口</Row>
            <div className="button-group">
              {entranceList.map((item) => (
                <div key={item.name} className="button-item">
                  <Button
                    type={item.type}
                    icon={item.icon} // 添加图标
                    onClick={() => handleClick(item)}
                    className="entrance-button"
                  >
                    {item.title}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          <Card className="chart-card">
            <Row className="title">用户数据</Row>
            <div className="time-select">
              <Select
                value={userChartRequest.date}
                onChange={(value) => {
                  setUserChartRequest({ date: value });
                  fetchChartInfo();
                }}
                style={{ width: 200 }}
              >
                {userChartOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
            {isShow && <UserActivityChart chart={chart} />}
          </Card>
        </Col>
        <Col span={10}>
          <Card className="aside">
            <Row className="title">博客声明</Row>
            <div className="text">
              <Text>
                欢迎访问本博客！本博客致力于分享技术文章、开发经验及个人心得，内容主要涵盖编程技术、前端开发、后端开发、数据库设计、软件架构、开源项目等领域。
                <h3>版权声明</h3>
                本博客中的所有原创文章版权归博客作者所有，转载请注明来源。
                <br />
                部分文章可能涉及引用其他来源的内容，引用的内容会明确标注出处，版权归原作者所有。
                <br />
                如果您认为本博客的某些内容侵犯了您的版权或其他权益，请及时联系我们，我们将立即处理。
                <h3>使用条款</h3>
                本博客内容仅供参考和学习交流使用。作者不对内容的准确性、完整性或时效性作出保证，使用时请自行判断。
                <br />
                本博客的部分内容可能受到第三方工具、平台的影响，无法完全控制其准确性和可用性，使用时请谨慎。
                <h3>隐私政策</h3>
                本博客不会主动收集您的个人信息，除非您主动通过留言、评论或联系方式与我们进行交流。
                <br />
                所有个人信息将严格保密，不会外泄或用于其他不当用途。
                <h3>联系方式</h3>
                如有任何问题或建议，欢迎通过以下方式与我们联系：
                <br />
                邮箱：[{websiteStore.websiteInfo.email}]
                <br />
                感谢您的支持和关注，希望本博客能为您的技术成长和知识积累带来帮助！
              </Text>
            </div>
          </Card>
        </Col>
      </div>
    </div>
  );
};

export default Home;