# ☁️ Atmos (°Ꞓ)

> **Unadulterated atmospheric thermodynamics. Universal platform equity. Zero ad bloat.**

[![Live Web App](https://img.shields.io/badge/Production-felsiusatmos.netlify.app-00C7B7?style=flat-square&logo=netlify)](https://felsiusatmos.netlify.app)
[![Repository](https://img.shields.io/badge/GitHub-YoVariable%2FAtmos-181717?style=flat-square&logo=github)](https://github.com/YoVariable/Atmos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

Atmos is an opinionated, high-precision weather platform engineered to deliver raw atmospheric telemetry without artificial text-smoothing, data-damping, or intrusive ad feeds. 

All temperature metrics across the application are rendered exclusively in **Felsius (°Ꞓ)**, a thermodynamic scale defined by the exact arithmetic mean of Celsius and Fahrenheit.

---

## 🔒 The Felsius Dictatorship

Atmos provides full platform equity and location freedom, subject to one non-negotiable constraint: **The temperature unit setting is permanently locked behind `🔒 °Ꞓ`.** 

There is no Celsius toggle. There is no Fahrenheit toggle. Do the pre-algebra or go touch some platform-agnostic polar grass.

---

## 📐 The Mathematical Engine

Felsius is defined as the exact arithmetic mean of Celsius and Fahrenheit:

$$\text{°Ꞓ} = \frac{\text{°C} + \text{°F}}{2}$$

The exact linear transformation equations enforced by the Atmos conversion engine:

* **Celsius to Felsius:** $$\text{°Ꞓ} = 1.4(\text{°C}) + 16$$
* **Felsius to Celsius:** $$\text{°C} = \frac{\text{°Ꞓ} - 16}{1.4}$$
* **Felsius to Fahrenheit:** $$\text{°F} = \frac{1.8(\text{°Ꞓ}) + 16}{1.4}$$
* **Fahrenheit to Felsius:** $$\text{°Ꞓ} = \frac{1.4(\text{°F}) - 16}{1.8}$$

### Operational Identity Proof
* **58°Ꞓ** maps cleanly to whole integers: **30°C** and **86°F**.
* **16°Ꞓ** represents the absolute freezing anchor (**0°C** / **32°F**).

---

## ⚡ Key Technical Features & Architecture

* **Unauthenticated Open-Meteo Engine:** Direct grid telemetry pipeline. Zero server-side text-smoothing, data-damping, or regional microclimate averaging.
* **Premium Dark Glassmorphism:** Frosted-glass `backdrop-filter` panel architecture, high-contrast typography, and tight grid padding.
* **Daylight Inversion Engine:** Custom diurnal canvas curve tracking true planetary axial tilt:
  * **Equatorial Regions:** Renders a flat horizontal 12-hour daylight equilibrium curve year-round.
  * **Antarctic Circle:** Dynamically renders Polar Night (0 hours daylight) during polar winter with an inverted graph trough valley and vice versa.
  * **Arctic Circle:** Dynamically renders Midnight Sun (24 hours daylight) during polar summer with a flat ceiling graph curve and vice versa.
* **Negative Canvas Geometry Patch:** TypeScript-patched graph coordinate system translating negative grid height parameters seamlessly down to extreme sub-zero polar floors (e.g., -45°Ꞓ to -49°Ꞓ).
* **Dynamic Warning Banners:** Automatic warning overlays trigger for Extreme Heat (e.g., Death Valley spikes at 84°Ꞓ / 48.6°C) and Extreme Cold.
* **Precision Asset Swapping:** Sub-16°Ꞓ parameters dynamically swap default cloud assets for a standalone red vector snowflake (`snowflake.svg`). Air quality metrics preserve numeric typography symmetry using standard μg/m³.

---

## 🌐 Universal Platform Equity

Atmos runs on any hardware screen—from flagship mobile devices to internet-connected kitchen appliances:

* **Web Deployment:** [felsiusatmos.netlify.app](https://felsiusatmos.netlify.app)
* **Android:** Native signed `.apk` binaries available under [Releases](../../releases)
* **iOS:** Signed `.ipa` packages available under [Releases](../../releases)

---

## 🛠️ Local Development Setup

```bash
# Clone repository
git clone [https://github.com/YoVariable/Atmos.git](https://github.com/YoVariable/Atmos.git)

# Navigate into project root
cd Atmos

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build production bundle
pnpm build

```

---

## 📄 License & Acknowledgments

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

Atmospheric Data: [Open-Meteo API](https://open-meteo.com/)

Hosting Edge Network: [Netlify](https://www.netlify.com/)

Developer: [@YoVariable](https://github.com/YoVariable)