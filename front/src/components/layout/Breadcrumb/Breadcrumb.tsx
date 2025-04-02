import 
  React, { 
    useEffect, 
    useState 
  } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import './Breadcrumb.css';

interface RouteMeta {
  title: string;
  path: string;
}

const BreadcrumbComponent: React.FC = () => {
  const location = useLocation(); // 获取当前路由信息
  const [breadcrumbItems, setBreadcrumbItems] = useState<RouteMeta[]>([]);

  useEffect(() => {
    // 使用 location.pathname 解析面包屑数据
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbPaths: RouteMeta[] = pathnames.map((path, index) => {
      const fullPath = `/${pathnames.slice(0, index + 1).join('/')}`;
      const title = path.charAt(0).toUpperCase() + path.slice(1); // 将路径的首字母大写
      return { title, path: fullPath };
    });

    // 添加首页链接
    const homeBreadcrumb: RouteMeta = { title: 'Home', path: '/' };
    setBreadcrumbItems([homeBreadcrumb, ...breadcrumbPaths]);
  }, [location.pathname]);

  // 将 breadcrumbItems 转换为 Ant Design 的 items 格式
  const items = breadcrumbItems.map((item, index) => ({
    title: index < breadcrumbItems.length - 1 ? (
      <Link to={item.path}>{item.title}</Link>
    ) : (
      item.title
    ),
  }));

  return (
    <div className="breadcrumb">
      <Breadcrumb separator="/" items={items} /> {/* 使用 items 属性 */}
    </div>
  );
};

export default BreadcrumbComponent;