import 
  React, { 
    useState, 
    useEffect 
  } from "react";
import { Button } from "antd";
import "./hero.css";

const Hero: React.FC = () => {
  const fullText = "欢迎来到我的网站"; // 需要显示的完整文本
  const [displayText, setDisplayText] = useState(""); // 当前显示的文本
  const [index, setIndex] = useState(0); // 当前打字位置索引
  const [isDeleting, setIsDeleting] = useState(false); // 是否在删除文本

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && index < fullText.length) {
      // 逐字显示
      timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, index + 1));
        setIndex(index + 1);
      }, 200);
    } else if (!isDeleting && index === fullText.length) {
      // 停顿 5s 后开始删除
      timeout = setTimeout(() => setIsDeleting(true), 3000);
    } else if (isDeleting && index > 0) {
      // 逐字删除
      timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, index - 1));
        setIndex(index - 1);
      }, 100);
    } else if (isDeleting && index === 0) {
      // 删除完成，重新开始
      setIsDeleting(false);
    }

    return () => clearTimeout(timeout); // 清除定时器
  }, [index, isDeleting, fullText]);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="hero">
      <h1 className="hero-title">{displayText}</h1>
      <p className="hero-subtitle">探索更多精彩内容</p>
      <Button type="primary" size="large" onClick={scrollToContent} className="hero-button">
        向下滑动
      </Button>
      <div className="scroll-prompt">
        <div className="arrow"></div>
        <div className="arrow" style={{ animationDelay: '0.2s' }}></div>
        <div className="arrow" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default Hero;