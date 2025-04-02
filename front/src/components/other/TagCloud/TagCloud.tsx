import { useState, useEffect } from "react";
import { articleTags } from "@/api/article";
import "./TagCloud.css";

interface TagCloudItem {
  tag: string;
  number: number;
  type: string;
}

const tagTypes = ["primary", "success", "info", "warning", "danger"];

const TagCloud = () => {
  const [tagCloudArray, setTagCloudArray] = useState<TagCloudItem[]>([]);

  // 获取标签云数据
  const getTagCloudArray = async () => {
    const res = await articleTags();
    if (res.code === 0) {
      const tagsArray = res.data;
      const cloudArray = tagsArray.map((item, index) => ({
        tag: item.tag,
        number: item.number,
        type: tagTypes[index % tagTypes.length]
      }));
      setTagCloudArray(cloudArray);
    }
  };

  useEffect(() => {
    getTagCloudArray();
  }, []);

  // const handleSearchJumps = (tag: string) => {
  //   window.open("/search?tag=" + tag);
  // };

  return (
    <div className="tag-cloud">
      <div className="title">标签云</div>
      <div>
        {tagCloudArray.map((item) => (
          <span
            key={item.tag}
            className={`el-tag el-tag--${item.type} el-tag--large`}
          >
            {item.tag} {item.number}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TagCloud;
