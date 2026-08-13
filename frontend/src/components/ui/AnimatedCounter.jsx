import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

/**
 * Feature #16 — Animated Counter
 * Counts from 0 to `end` once when the element scrolls into view.
 * Uses react-countup + react-intersection-observer (already installed).
 */
const AnimatedCounter = ({
  end = 0,
  duration = 1.6,
  suffix = '',
  className = '',
}) => {
  const [started, setStarted] = useState(false);
  const { ref } = useInView({
    triggerOnce: true,
    threshold: 0.3,
    onChange: (inView) => { if (inView) setStarted(true); },
  });

  return (
    <span ref={ref} className={className}>
      {started ? (
        <CountUp start={0} end={end} duration={duration} suffix={suffix} useEasing />
      ) : (
        0
      )}
    </span>
  );
};

export default AnimatedCounter;
