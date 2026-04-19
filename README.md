# ArchiGEM Studio 🏛️✨
**The Ultimate AI-Powered Architectural & Interior Design Suite**

ArchiGEM Studio is an advanced web-based toolkit built for architects, interior designers, and 3D artists. Powered by Google's cutting-edge **Gemini 2.5 Flash** and **Gemini 3.0 Pro** models, it accelerates spatial design workflows—from initial napkin sketches to photorealistic 4K renders, and all the way to finalized presentation boards.

---

## 🚀 Features

ArchiGEM Studio provides a comprehensive set of AI tools specifically tuned for architectural generation:

- ✏️ **Sketch to Image**: Transform loose hand drawings or CAD lines into stunning photorealistic or stylized renders.
- 🖼️ **Image to Sketch**: Convert a photo or render back into a technical or artistic architectural sketch.
- 🎨 **Moodboard to Render**: Generate a cohesive room or building design derived from a collage of reference images.
- ✨ **Render Enhancer**: Improve lighting, textures, and realism of an existing 3D render.
- 🎥 **Camera Angle (3D Reconstruction)**: Re-imagine your scene from an entirely new perspective using our virtual studio.
- 🔍 **Close-Up Render**: Generate high-fidelity macro shots of specific material details using a focus point.
- 🏙️ **Modify Exterior**: Change facade materials, landscaping contexts, or weather/time of day for building exteriors.
- 🛋️ **Modify Interior**: Redecorate rooms with new furniture styles, colors, and layout adjustments.
- 📐 **3D to Facade / Elevation**: Generate flat 2D orthographic technical drawings directly from 3D perspective images.
- 📋 **Presentation Board**: Instantly create full architectural presentation sheets complete with plans, sections, and form evolution diagrams.
- 🪄 **X-Ray Section**: Visualize the internal structure by creating an interactive cutaway section view.
- ⬆️ **Upscale**: Regenerate any image at maximum 4K resolution with enhanced micro-details.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS 
- **AI Integration**: `@google/genai` (Targeting `gemini-3-pro-image-preview` and `gemini-2.5-flash`)
- **Language**: TypeScript

---

## 💻 Getting Started (Local Development)

### 1. Install Dependencies
Make sure you have Node installed, then run:
```bash
npm install
```

### 2. Configure API Key
ArchiGEM uses the Gemini Developer API to execute its image generation logic.
1. Rename the `.env.example` file to `.env.local`
2. Add your personal Gemini API key:
```env
VITE_GEMINI_API_KEY=your-api-key-here
```
*(Alternatively, you can skip this step and input your API Key via the "API Config" button directly within the app's UI! Your key will be securely saved in your browser's local storage).*

### 3. Start the Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start designing!

---

## 🌍 Languages
ArchiGEM natively supports full localization for both **English (US)** and **Vietnamese (VN)**.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request if you'd like to expand our AI tooling palette.
