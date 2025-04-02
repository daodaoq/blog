import React, { useState, useEffect } from 'react';
import { Card, Row } from 'antd';
import { websiteCalendar, WebsiteCalendarResponse } from '@/api/website';
import './canlendar.css';

const Calendar: React.FC = () => {
  const [calendarInfo, setCalendarInfo] = useState<WebsiteCalendarResponse>({
    date: '',
    lunar_date: '',
    ganzhi: '',
    zodiac: '',
    day_of_year: '',
    solar_term: '',
    auspicious: '',
    inauspicious: '',
  });
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    const timerId = setInterval(updateCurrentTime, 1000);

    // Fetch calendar info
    const getCalendarInfo = async () => {
      const res = await websiteCalendar();
      if (res.code === 0) {
        setCalendarInfo(res.data);
      }
    };
    getCalendarInfo();

    // Cleanup interval on component unmount
    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <Card className="calendar">
      <Row className="title">今日日历</Row>
      <Row>时间：{calendarInfo.date} {currentTime}</Row>
      <Row>农历：{calendarInfo.lunar_date}</Row>
      <Row>干支：{calendarInfo.ganzhi}</Row>
      <Row>星座：{calendarInfo.zodiac}</Row>
      <Row>天次：{calendarInfo.day_of_year}</Row>
      <Row>节气：{calendarInfo.solar_term}</Row>
      {/* <Row>宜项：{calendarInfo.auspicious}</Row>
      <Row>禁忌：{calendarInfo.inauspicious}</Row> */}
    </Card>
  );
};

export default Calendar;
