"use client";

import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";

type CarouselProps = {
  items: string[];
};

const Carousel: React.FC<CarouselProps> = ({ items }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="w-4/5 mx-auto">
      <Slider {...settings}>
        {items.map((item, index) => (
          <div key={index} className="px-2 pt-7">
            <div className="text-center">{item}</div>
            <div className="flex items-center justify-center h-[170px] rounded-lg">
              <Image
                src="/images/testimage.svg"
                alt="Example SVG"
                width={300}
                height={300}
              />
            </div>
          </div>
        ))}
      </Slider>
      <style jsx global>{`
        /* 화살표 스타일링 */
        .slick-prev,
        .slick-next {
          margin-top: 25px; /* 화살표를 아래로 12px 이동 */
        }
      `}</style>
    </div>
  );
};

export default Carousel;
