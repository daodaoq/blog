import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Typography, 
  Image 
} from 'antd';
import WebNavbar from '@/components/layout/WebNavbar/WebNavbar';
import { friendLinkInfo } from '@/api/friend-link';
import './friend-link.css'; // 引入外部 CSS 文件

const { Text } = Typography;

// 定义友链数据的类型
interface FriendLink {
  link: string;
  logo: string;
  name: string;
  description: string;
  id: number;
  created_at: Date;
  updated_at: Date;
}

const FriendLink = () => {
  const [friendLinkList, setFriendLinkList] = useState<FriendLink[]>([]);

  const getFriendLinkInfo = async () => {
    const res = await friendLinkInfo();
    console.log(res)
    if (res.code === 0) {
      console.log(res.data.list)
      setFriendLinkList(res.data.list);
    }
  };

  useEffect(() => {
    getFriendLinkInfo();
  }, []);

  const handleFriendLinkJumps = (link: string) => {
    window.open(link);
  };

  return (
    <div className="friend-link">
      <WebNavbar />
      <div className="main-content">
        <div className="container">
          <div className="el-main">
            <Row className="title">友链列表</Row>
            <div className="list">
              {friendLinkList.map((item, index) => (
                <Card
                  key={index}
                  className="el-card"
                  onClick={() => handleFriendLinkJumps(item.link)}
                  hoverable
                  styles={{
                    body: {
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    },
                  }}
                >
                  <div className="logo">
                    <Image
                      width={64}
                      height={64}
                      src={item.logo}
                      alt={item.name}
                      className="logo-image"
                    />
                    <Row className="name">{item.name}</Row>
                  </div>
                  <div className="description">
                    <Text>{item.description}</Text>
                  </div>
                </Card>

              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendLink;
