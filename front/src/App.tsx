import AppRouter from "./router";
import { useEffect } from 'react';
import { initializeStore } from './stores/website';

const App = () => {
  // 在组件加载时初始化网站信息
  useEffect(() => {
    initializeStore();
  }, []);
  return (
    <div>
      <AppRouter />
    </div>
  );
}

export default App;
