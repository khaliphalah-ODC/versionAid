<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SourceBadge from '../components/SourceBadge.vue'
import { simulate } from '../data-sources/simulator'

const preview = simulate('normal')
</script>

<template>
  <section class="hero" aria-labelledby="welcome-heading">
    <div class="hero-content">
      <h1 id="welcome-heading">Seeing Beyond <span>Sight</span></h1>
      <p class="intro">VisionAid is a smart-cane companion prototype for people with visual impairments in Liberia.</p>
      <p>Explore how three-direction obstacle readings appear in the app, or view your phone’s location with your permission.</p>
      <div class="hero-actions">
        <RouterLink class="action primary" to="/dashboard">Open sensor demo</RouterLink>
        <RouterLink class="action secondary" to="/gps">Open GPS tracking</RouterLink>
      </div>
    </div>

    <div class="hero-visual">
      <figure class="concept">
        <img src="/cane-concept.jpg" width="512" height="279" alt="Concept illustration of a three-sensor attachment clipped to a white cane">
        <figcaption>Smart-cane attachment concept</figcaption>
      </figure>
      <section class="preview" aria-labelledby="preview-heading">
        <h2 id="preview-heading">Sensor preview</h2>
        <SourceBadge source="simulator" />
        <dl>
          <div v-for="reading in preview.readings" :key="reading.direction">
            <dt>{{ reading.direction }}</dt>
            <dd>{{ reading.distanceCm }} cm</dd>
          </div>
        </dl>
      </section>
    </div>
  </section>

  <section class="features" aria-label="Explore VisionAid">
    <article class="feature">
      <h2>Obstacle monitoring</h2>
      <p>Try front and left obstacles, a sensor failure, and stale data using five repeatable demo scenarios.</p>
      <RouterLink class="feature-link" to="/monitor">Open monitoring</RouterLink>
    </article>
    <article class="feature">
      <h2>Location on your device</h2>
      <p>View your position while GPS Tracking is open, or follow the simulated route in Demo Mode. Caretaker sharing is unavailable.</p>
      <RouterLink class="feature-link" to="/gps">Open GPS tracking</RouterLink>
    </article>
    <article class="feature">
      <h2>Install and use offline</h2>
      <p>Choose <strong>Install app</strong> or <strong>Add to Home Screen</strong> from your browser menu. On iPhone or iPad, use Safari’s Share menu.</p>
      <p>After one online visit, wait for the offline-ready message. The sensor demo and GPS demo can then run offline.</p>
    </article>
  </section>

  <p class="hardware-note">The cane hardware handles immediate obstacle warnings independently. Bluetooth integration is pending.</p>
</template>

<style scoped>
.hero {
  display: grid;
  gap: clamp(1.35rem, 4vw, 3rem);
  align-items: center;
  padding: clamp(1.1rem, 4vw, 2.75rem);
  border: 1px solid #c9dbd6;
  border-radius: 1.4rem;
  background: linear-gradient(130deg, #fbfdfc 15%, #e4f3ef 100%);
}
.hero h1 {
  margin: 0;
  max-width: 10ch;
  font-size: clamp(2.45rem, 1.6rem + 3.2vw, 4.7rem);
  line-height: 1.06;
  letter-spacing: -.055em;
}
.hero h1 span { color: #00646f; }
.hero-content p { margin-block: 1rem 0; max-width: 42ch; }
.intro { font-size: 1.125rem; font-weight: 600; }
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-top: 1.45rem;
}
.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: .35rem 1rem;
  box-sizing: border-box;
  border: 1px solid #00646f;
  border-radius: .6rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}
.primary { background: #00646f; color: white; }
.primary:hover { background: #004a51; }
.secondary { background: white; color: #004a51; }
.secondary:hover { background: #eff7f5; }
.hero-visual { min-width: 0; }
.concept {
  margin: 0;
  padding: .65rem .65rem 1.25rem;
  border: 1px solid #c9dbd6;
  border-radius: 1rem;
  background: white;
}
.concept img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: .55rem;
}
.concept figcaption {
  margin: .45rem .25rem 0;
  font-size: .875rem;
  color: #3d5954;
}
.preview {
  position: relative;
  margin: -.65rem 0 0 clamp(.15rem, 3vw, 1.6rem);
  padding: clamp(.7rem, 3vw, 1.15rem);
  border-radius: .85rem;
  background: #102e2c;
  color: #f4faf8;
  box-shadow: 0 .6rem 1.35rem #102e2c24;
}
.preview h2, .feature h2 {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.3;
}
.preview dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3.9rem, 1fr));
  gap: .45rem;
  margin: 0;
}
.preview dl div {
  padding: .4rem .45rem;
  border-radius: .45rem;
  background: #234441;
}
.preview dt { color: #d1ebe1; text-transform: capitalize; }
.preview dd { margin: 0; font-weight: 700; }
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: .85rem;
  margin-top: 1rem;
}
.feature {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: .6rem;
  padding: 1.2rem;
  border: 1px solid #c9dbd6;
  border-radius: .85rem;
  background: white;
}
.feature p { margin: 0; }
.feature-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: auto;
  color: #005760;
  font-weight: 700;
}
.hardware-note { margin-block: 1rem 0; color: #3d5954; }

@media (min-width: 48rem) and (max-width: 61.99rem), (min-width: 75rem) {
  .hero { grid-template-columns: 1fr 1fr; }
}
</style>
