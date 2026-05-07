import React, { useEffect, useState, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

interface CountUpProps {
  target: number;
  suffix?: string;
  duration?: number;
}

const formatNumber = (num: number, suffix?: string) => {
  if (suffix === "k") {
    return (num / 1000).toFixed(0) + suffix;
  }
  return Math.floor(num) + (suffix || "");
};

const CountUp: React.FC<CountUpProps> = ({
  target,
  suffix = "",
  duration = 2000,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, target, {
        duration: duration / 1000,
        ease: "easeOut",
        onUpdate(latest) {
          setCount(latest);
        },
      });
      return () => controls.stop();
    }
  }, [isInView, target, duration, motionValue]);

  return (
    <div ref={ref} className=" text-[#EAF0FF] xl:text-[64px] lg:text-[50px] max-md:text-center text-[25px] max-md:leading-4 md:text-[30px] font-semibold">
      {formatNumber(count, suffix)}
    </div>
  );
};

export default CountUp;
