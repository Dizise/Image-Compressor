# Animation Patterns Library

Production-ready animation patterns for memorable web experiences.

## Animation Philosophy

**Quality over Quantity**: One well-orchestrated moment beats scattered micro-interactions.

**Performance First**: Animate transform and opacity only. Avoid animating width, height, top, left.

**Respect Preferences**: Always include reduced-motion fallbacks.

## Page Load Animations

### Staggered Fade-In (Classic)

```css
.fade-in-stagger > * {
  animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.fade-in-stagger > *:nth-child(1) { animation-delay: 0.1s; }
.fade-in-stagger > *:nth-child(2) { animation-delay: 0.2s; }
.fade-in-stagger > *:nth-child(3) { animation-delay: 0.3s; }
.fade-in-stagger > *:nth-child(4) { animation-delay: 0.4s; }
.fade-in-stagger > *:nth-child(5) { animation-delay: 0.5s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Scale-In Reveal

```css
.scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Slide-In from Side

```css
.slide-in-left {
  animation: slideInLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Text Reveal (Split Animation)

```css
/* Requires splitting text into spans */
.text-reveal span {
  display: inline-block;
  animation: textReveal 0.5s cubic-bezier(0.77, 0, 0.175, 1) backwards;
}

.text-reveal span:nth-child(1) { animation-delay: 0.05s; }
.text-reveal span:nth-child(2) { animation-delay: 0.1s; }
.text-reveal span:nth-child(3) { animation-delay: 0.15s; }
/* ... continue for each character */

@keyframes textReveal {
  from {
    opacity: 0;
    transform: translateY(100%) rotate(10deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}
```

## Hover Effects

### Lift & Shadow

```css
.card-lift {
  transition: 
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 25px rgba(0, 0, 0, 0.15),
    0 10px 10px rgba(0, 0, 0, 0.1);
}
```

### Magnetic Button

```css
.magnetic-button {
  position: relative;
  transition: transform 0.2s ease;
}

.magnetic-button::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: inherit;
  opacity: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  transition: opacity 0.3s ease;
}

.magnetic-button:hover::before {
  opacity: 1;
}
```

```javascript
// JavaScript for magnetic effect
const button = document.querySelector('.magnetic-button');

button.addEventListener('mousemove', (e) => {
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  
  button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
});

button.addEventListener('mouseleave', () => {
  button.style.transform = 'translate(0, 0)';
});
```

### Underline Expansion

```css
.link-underline {
  position: relative;
  text-decoration: none;
}

.link-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.link-underline:hover::after {
  width: 100%;
}
```

### Color Shift

```css
.button-gradient {
  background: linear-gradient(
    135deg,
    #667eea 0%,
    #764ba2 100%
  );
  background-size: 200% 200%;
  background-position: 0% 50%;
  transition: background-position 0.5s ease;
}

.button-gradient:hover {
  background-position: 100% 50%;
}
```

### Ripple Effect

```css
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  inset: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.ripple:active::after {
  width: 300%;
  height: 300%;
}
```

## Scroll-Triggered Animations

### Intersection Observer Pattern

```javascript
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Optional: stop observing after animation
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all elements with .reveal class
document.querySelectorAll('.reveal').forEach(el => {
  observer.observe(el);
});
```

### Parallax Scrolling

```css
.parallax {
  transform: translateY(var(--scroll));
}
```

```javascript
const parallaxElements = document.querySelectorAll('.parallax');

window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  
  parallaxElements.forEach(el => {
    const speed = el.dataset.speed || 0.5;
    const offset = scrolled * speed;
    el.style.setProperty('--scroll', `${offset}px`);
  });
});
```

### Scroll Progress Bar

```css
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--scroll-progress);
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  z-index: 1000;
}
```

```javascript
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  
  document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
});
```

## Framer Motion Patterns (React)

### Page Transitions

```jsx
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

function App() {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Stagger Children

```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.ul
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.text}
    </motion.li>
  ))}
</motion.ul>
```

### Drag & Drop

```jsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
>
  Drag me!
</motion.div>
```

### Morph Animation

```jsx
const [isOpen, setIsOpen] = useState(false);

<motion.div
  layout
  onClick={() => setIsOpen(!isOpen)}
  style={{
    width: isOpen ? 300 : 100,
    height: isOpen ? 300 : 100
  }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
  Click to expand
</motion.div>
```

### Gesture Animations

```jsx
<motion.button
  whileHover={{ 
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Interactive Button
</motion.button>
```

## Loading Animations

### Skeleton Screens

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Spinner

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Pulse Effect

```css
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Background Animations

### Gradient Animation

```css
.gradient-animate {
  background: linear-gradient(
    45deg,
    #667eea,
    #764ba2,
    #f093fb,
    #4facfe
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Floating Elements

```css
.float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
```

### Particle Effect (CSS only)

```css
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  animation: particle 10s linear infinite;
}

@keyframes particle {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(var(--x) * 100px),
      calc(var(--y) * 100px)
    ) scale(0);
    opacity: 0;
  }
}

/* Create multiple particles with different --x, --y values */
.particle:nth-child(1) { --x: 1; --y: -1; animation-delay: 0s; }
.particle:nth-child(2) { --x: -1; --y: 1; animation-delay: 1s; }
.particle:nth-child(3) { --x: 1; --y: 1; animation-delay: 2s; }
```

## Performance Best Practices

### Hardware Acceleration

```css
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU rendering */
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animation Performance Checklist

- [ ] Only animate `transform` and `opacity`
- [ ] Use `will-change` for expensive animations
- [ ] Keep animations under 60fps (16.67ms per frame)
- [ ] Remove `will-change` after animation completes
- [ ] Test on low-end devices
- [ ] Include reduced-motion fallbacks
- [ ] Debounce scroll listeners
- [ ] Use `requestAnimationFrame` for JS animations

## Easing Functions

### Custom Cubic Beziers

```css
:root {
  /* Ease in/out variants */
  --ease-in-quad: cubic-bezier(0.55, 0.085, 0.68, 0.53);
  --ease-in-cubic: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
  
  /* Spring-like */
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Smooth */
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Anticipate */
  --ease-anticipate: cubic-bezier(0.22, 1, 0.36, 1);
}
```

Remember: Less is more. One well-orchestrated animation sequence beats dozens of scattered effects.
