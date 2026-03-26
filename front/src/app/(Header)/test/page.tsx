import Carousel from "@/app/_components/common/manage/ResponsiveSlider";
import React from "react";

const page = () => {
  return (
    <div className="w-[500px]">
      <Carousel
        items={["item1", "item2", "item3", "item4", "item5", "item6"]}
      />
    </div>
  );
};

export default page;
