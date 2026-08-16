import { useEffect, useState } from "react";

// 🔽 IMPORT YOUR IMAGES HERE
import slide1 from "../assets/slider/slide1.avif";
import slide2 from "../assets/slider/slide2.jpg";
import slide3 from "../assets/slider/slide3.png";
import slide4 from "../assets/slider/slide4.jpg";
import slide5 from "../assets/slider/slide5.jpg";

const slides = [
  {
    image: slide1,
    caption: "Helping Flood Victims Across Regions",
  },
  {
    image: slide2,
    caption: "Helping Earthquake Survivors Rebuild Lives",
  },
  {
    image: slide3,
    caption: "Together We Make a Difference",
  },
  {
    image: slide4,
    caption: "Emergency Response in Action",
  },
  {
    image: slide5,
    caption: "Transparent Donation Tracking",
  },
];

export default function Slider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slider-container">
      <img
        src={slides[current].image}
        alt="Disaster Slide"
        className="slider-image"
      />

      <div className="slider-caption">
        {slides[current].caption}
      </div>

      {/* MANUAL CONTROLS */}
      <div className="slider-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={current === index ? "dot active-dot" : "dot"}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}
