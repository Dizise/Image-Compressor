# Typography Mastery

Advanced typography patterns for memorable web design.

## Font Psychology

### Serif Fonts - Trust, Tradition, Elegance

**Playfair Display**
- Use for: Luxury brands, editorial content, high-end products
- Pairs with: DM Sans, Source Sans Pro
- Emotional tone: Sophisticated, refined, established

**Crimson Pro**
- Use for: Publishing, reading-heavy sites, academic content
- Pairs with: Work Sans, IBM Plex Sans
- Emotional tone: Intellectual, trustworthy, classic

**Lora**
- Use for: Blogs, articles, storytelling
- Pairs with: Lato, Nunito Sans
- Emotional tone: Warm, friendly, readable

**Fraunces**
- Use for: Creative agencies, unique brands, art platforms
- Pairs with: Outfit, Cabinet Grotesk
- Emotional tone: Quirky, distinctive, memorable

### Sans-Serif Fonts - Modern, Clean, Approachable

**DM Sans**
- Use for: SaaS products, modern brands, tech companies
- Pairs with: Playfair Display, Spectral
- Emotional tone: Professional, geometric, clean

**Manrope**
- Use for: Startups, apps, digital products
- Pairs with: Lora, Merriweather
- Emotional tone: Friendly, open, modern

**Outfit**
- Use for: Fashion, lifestyle, creative projects
- Pairs with: Fraunces, Crimson Pro
- Emotional tone: Contemporary, stylish, versatile

**Sora**
- Use for: Tech products, futuristic brands, AI/ML companies
- Pairs with: JetBrains Mono, Fira Code
- Emotional tone: Technical, forward-thinking, precise

**Cabinet Grotesk**
- Use for: Design studios, portfolios, agencies
- Pairs with: Spectral, Libre Baskerville
- Emotional tone: Refined, sophisticated, modern

### Display Fonts - Impact, Personality, Headlines

**Anton**
- Use for: Headlines, impact statements, sports brands
- Pairs with: Roboto Condensed, Source Sans Pro
- Emotional tone: Bold, powerful, condensed

**Bebas Neue**
- Use for: Posters, banners, attention-grabbing headers
- Pairs with: Montserrat, Open Sans
- Emotional tone: Strong, condensed, impactful

**Righteous**
- Use for: Fun brands, gaming, youth-oriented products
- Pairs with: Quicksand, Varela Round
- Emotional tone: Playful, rounded, energetic

**Unbounded**
- Use for: Tech brands, futuristic products, innovation
- Pairs with: IBM Plex Sans, JetBrains Mono
- Emotional tone: Modern, geometric, tech-forward

## Typography Scale Systems

### Modular Scale (Musical Harmony)

Based on mathematical ratios:

```css
/* Major Third (1.25) */
:root {
  --text-xs: 0.64rem;    /* 10.24px */
  --text-sm: 0.8rem;     /* 12.8px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.563rem;   /* 25px */
  --text-2xl: 1.953rem;  /* 31.25px */
  --text-3xl: 2.441rem;  /* 39px */
  --text-4xl: 3.052rem;  /* 48.83px */
  --text-5xl: 3.815rem;  /* 61px */
}

/* Perfect Fourth (1.333) - More dramatic */
:root {
  --text-xs: 0.563rem;
  --text-sm: 0.75rem;
  --text-base: 1rem;
  --text-lg: 1.333rem;
  --text-xl: 1.777rem;
  --text-2xl: 2.369rem;
  --text-3xl: 3.157rem;
  --text-4xl: 4.209rem;
  --text-5xl: 5.61rem;
}

/* Golden Ratio (1.618) - Maximum drama */
:root {
  --text-xs: 0.382rem;
  --text-sm: 0.618rem;
  --text-base: 1rem;
  --text-lg: 1.618rem;
  --text-xl: 2.618rem;
  --text-2xl: 4.236rem;
  --text-3xl: 6.854rem;
  --text-4xl: 11.089rem;
  --text-5xl: 17.942rem;
}
```

### Fluid Typography

Responsive sizing without breakpoints:

```css
/* Basic fluid type */
.title {
  font-size: clamp(2rem, 5vw, 5rem);
}

/* More control with calc */
.heading {
  font-size: calc(1.5rem + 2vw);
  line-height: 1.2;
}

/* Full fluid system */
:root {
  --fluid-min-width: 320;
  --fluid-max-width: 1200;
  
  --fluid-type-min: 16;
  --fluid-type-max: 20;
}

body {
  font-size: calc(
    (var(--fluid-type-min) * 1px) + 
    (var(--fluid-type-max) - var(--fluid-type-min)) * 
    (100vw - (var(--fluid-min-width) * 1px)) / 
    (var(--fluid-max-width) - var(--fluid-min-width))
  );
}
```

## Advanced Typography Techniques

### Optical Alignment

```css
/* Hanging punctuation */
.quote {
  hanging-punctuation: first last;
}

/* Negative letter-spacing for large text */
.display-title {
  font-size: 8rem;
  letter-spacing: -0.04em; /* Tighten large text */
}

/* Positive letter-spacing for small text */
.caption {
  font-size: 0.75rem;
  letter-spacing: 0.05em; /* Open up small text */
  text-transform: uppercase;
}
```

### Text Rendering Optimization

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern" 1, "liga" 1;
}
```

### Drop Caps

```css
.article::first-letter {
  font-size: 4em;
  font-weight: bold;
  line-height: 0.8;
  float: left;
  margin: 0.1em 0.1em 0 0;
  color: var(--accent);
}
```

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Text Shadow Effects

```css
/* Subtle depth */
.text-depth {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Glow effect */
.text-glow {
  text-shadow: 
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(255, 255, 255, 0.6),
    0 0 30px rgba(255, 255, 255, 0.4);
}

/* Layered shadow */
.text-layered {
  text-shadow:
    1px 1px 0 #999,
    2px 2px 0 #888,
    3px 3px 0 #777,
    4px 4px 0 #666,
    5px 5px 0 #555;
}
```

## Reading Experience Optimization

### Line Length

```css
/* Optimal reading line length: 45-75 characters */
.article-content {
  max-width: 65ch; /* ~65 characters */
  margin-inline: auto;
}
```

### Line Height

```css
/* Relationship: larger text = tighter line-height */
.display-1 {
  font-size: 4rem;
  line-height: 1; /* Tight for large text */
}

.body-text {
  font-size: 1.125rem;
  line-height: 1.7; /* Generous for body text */
}

.caption {
  font-size: 0.875rem;
  line-height: 1.4; /* Moderate for small text */
}
```

### Paragraph Spacing

```css
/* Modern: No indent, space between paragraphs */
.article p {
  margin-bottom: 1.5em;
}

/* Traditional: Indent, no space */
.article p {
  margin-bottom: 0;
  text-indent: 2em;
}

.article p:first-of-type {
  text-indent: 0; /* No indent on first paragraph */
}
```

## Typography Patterns by Style

### Brutalist Typography

```css
:root {
  --font-display: 'Arial Black', sans-serif;
  --font-body: 'Courier New', monospace;
}

.brutalist-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 10vw, 10rem);
  text-transform: uppercase;
  line-height: 0.9;
  letter-spacing: -0.02em;
  font-weight: 900;
}
```

### Editorial Typography

```css
:root {
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Serif Pro', serif;
}

.editorial-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 6rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-style: italic;
}

.editorial-body {
  font-family: var(--font-body);
  font-size: 1.25rem;
  line-height: 1.8;
  max-width: 65ch;
}
```

### Tech/Futuristic Typography

```css
:root {
  --font-display: 'Unbounded', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

.tech-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 5rem);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

## Variable Fonts

Use variable fonts for fine-tuned control:

```css
@font-face {
  font-family: 'Recursive';
  src: url('Recursive-VariableFont.woff2') format('woff2-variations');
  font-weight: 300 1000;
  font-style: oblique 0deg 15deg;
}

.variable-text {
  font-family: 'Recursive', sans-serif;
  font-variation-settings: 
    'MONO' 0,      /* 0 = Sans, 1 = Mono */
    'CASL' 0,      /* 0 = Linear, 1 = Casual */
    'wght' 700,    /* Weight: 300-1000 */
    'slnt' 0,      /* Slant: 0-15 */
    'CRSV' 0.5;    /* Cursive: 0-1 */
}
```

## Typography Checklist

Before finalizing typography:

- [ ] Fonts are distinctive (not Inter/Roboto/Arial)
- [ ] Display and body fonts pair well
- [ ] Font sizes have dramatic contrast
- [ ] Line heights appropriate for text size
- [ ] Line length is 45-75 characters
- [ ] Letter-spacing adjusted for large/small text
- [ ] Text is readable on all backgrounds
- [ ] Hierarchy is immediately clear
- [ ] Loading strategy in place (FOUT prevention)
- [ ] Fallback fonts specified
- [ ] Variable fonts used where beneficial

Remember: Typography is 80% of design. Get this right first.
