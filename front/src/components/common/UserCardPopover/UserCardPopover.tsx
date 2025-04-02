import React, { useState } from 'react';
import { Avatar, Popover } from 'antd';
import UserCard from '@/components/widgets/UserCard/UserCard';
import { UserCardResponse } from '@/api/user';
import './UserCardPopover.css'

interface UserCardPopoverProps {
  uuid: string;
}

const UserCardPopover: React.FC<UserCardPopoverProps> = ({ uuid }) => {
  const [childMessage, setChildMessage] = useState<UserCardResponse>({
    uuid: '',
    username: '',
    avatar: '',
    address: '',
    signature: '',
  });

  const handleDataFromChild = (message: UserCardResponse) => {
    setChildMessage(message);
  };

  return (
    <div className="user-card-popover">
      <Popover
        content={<UserCard uuid={uuid} userCardInfo={null} onUserCardInfoChange={handleDataFromChild} />}
        trigger="hover"
      >
        <Avatar src={childMessage.avatar} />
      </Popover>
    </div>
  );
};

export default UserCardPopover;
