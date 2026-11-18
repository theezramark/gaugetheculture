// Astro settings. `site` is used for canonical links and the RSS feed later.
import { defineConfig, fontProviders } from 'astro/config';

// Fonts are downloaded from Google ONCE, at build time, and served from gaugetheculture.com.
// Visitors never contact Google, so their IP addresses are not sent to a third party (GDPR).
const google = fontProviders.google();

export default defineConfig({
  site: 'https://gaugetheculture.com',
  fonts: [
    { name: 'Instrument Serif', cssVariable: '--font-serif', provider: google, weights: [400], styles: ['normal'], fallbacks: ['Times New Roman', 'serif'] },
    { name: 'Newsreader', cssVariable: '--font-read', provider: google, weights: [400, 500], styles: ['normal'], fallbacks: ['Georgia', 'serif'] },
    { name: 'Libre Franklin', cssVariable: '--font-sans', provider: google, weights: [400, 500, 600, 700], styles: ['normal'], fallbacks: ['Arial', 'sans-serif'] },
    // Logo fonts: blackletter (Gauge, drop cap, stamp numbers), brush (the), Cinzel (CULTURE)
    { name: 'UnifrakturCook', cssVariable: '--font-blackletter', provider: google, weights: [700], styles: ['normal'], fallbacks: ['serif'] },
    { name: 'Caveat Brush', cssVariable: '--font-brush', provider: google, weights: [400], styles: ['normal'], fallbacks: ['cursive'] },
    { name: 'Cinzel', cssVariable: '--font-cinzel', provider: google, weights: [600], styles: ['normal'], fallbacks: ['serif'] },
  ],
});
