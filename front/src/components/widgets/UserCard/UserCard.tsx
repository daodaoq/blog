import 
  React, { 
    useEffect, 
    useState 
  } from 'react';
import { 
  userCard, 
  UserCardRequest, 
  UserCardResponse 
} from '@/api/user';
import './UserCard.css';

interface UserCardProps {
  uuid: string;
  userCardInfo: UserCardResponse | null;
  onUserCardInfoChange: (userCardInfo: UserCardResponse) => void;
}

const UserCard: React.FC<UserCardProps> = ({ uuid, userCardInfo, onUserCardInfoChange }) => {
  const [userCardData, setUserCardData] = useState<UserCardResponse>({
    uuid: '',
    username: '',
    avatar: '',
    address: '',
    signature: '',
  });

  useEffect(() => {
    const getUserCard = async () => {
      if (userCardInfo) {
        setUserCardData(userCardInfo);
      } else {
        const userCardRequest: UserCardRequest = { uuid };
        const res = await userCard(userCardRequest);
        if (res.code === 0) {
          setUserCardData(res.data);
          onUserCardInfoChange(res.data);  // Pass the data back to the parent
        }
      }
    };

    getUserCard();
  }, [uuid, userCardInfo, onUserCardInfoChange]);

  return (
    <div className="user-card">
      <div className="user-info">
        <img className="user-avatar" src={userCardData.avatar} alt="Avatar" width={50} height={50} />
        <div className="user-username">{userCardData.username}</div>
        <div className="user-address">{userCardData.address}</div>
      </div>
      <div className="uuid">签名: {userCardData.signature}</div>
    </div>
  );
};

export default UserCard;
