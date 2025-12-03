
import { ToolId, ToolDefinition, Language } from './types';

const HIGH_QUALITY_MODEL = 'gemini-3-pro-image-preview';
const FAST_MODEL = 'gemini-2.5-flash-image';

const DICT = {
  en: {
    customPrompt: 'Custom Prompt',
    renderStyle: 'Render Style',
    materialHint: 'Material Hint',
    creativity: 'Creativity Level',
    sketchStyle: 'Sketch Style',
    lineWeight: 'Line Weight',
    spaceType: 'Space Type',
    styleCohesion: 'Style Cohesion',
    enhancementFocus: 'Enhancement Focus',
    lightingCondition: 'Lighting Condition',
    cameraStudio: 'Camera Studio',
    focusPoint: 'Focus Point',
    zoomCrop: 'Zoom / Crop Level',
    detailFocus: 'Detail Focus',
    dof: 'Depth of Field',
    macroLight: 'Macro Lighting',
    weatherTime: 'Weather / Time',
    landscape: 'Landscape Context',
    designStyle: 'Design Style',
    colorPalette: 'Color Palette',
    targetView: 'Target View',
    drawingStyle: 'Drawing Style',
    layoutComp: 'Layout Composition',
    bgStyle: 'Background Style',
    detailSharpness: 'Detail Sharpness',
    cutType: 'Section Cut',
    sketchToImage: {
      name: 'Sketch to Image',
      desc: 'Transform loose hand drawings or CAD lines into photorealistic renders.',
      styles: ['Photorealistic', 'Minimalist', 'Brutalist', 'Modern', 'Concept Art', 'Watercolor', 'Cyberpunk / Sci-Fi', 'Industrial / Lo-Fi', 'Cinematic', 'Traditional Ink', 'Chalk & Pastel', 'Oil Painting'],
      materials: ['Concrete & Glass', 'Brick & Black Steel', 'Warm Wood & Stone', 'White Plaster & Oak', 'Marble & Brass', 'Corten Steel & Concrete', 'Greenery & Vertical Gardens', 'Bamboo & Sustainable', 'Glass Curtain Wall']
    },
    imageToSketch: {
      name: 'Image to Sketch',
      desc: 'Convert a photo or render back into a technical or artistic architectural sketch.',
      styles: ['Technical Blueprint', 'Loose Pencil', 'Ink Illustration', 'Charcoal', 'Watercolor Wash', 'Marker Pen', 'Hand Sketch', 'Architectural Concept']
    },
    moodboard: {
      name: 'Moodboard to Render',
      desc: 'Generate a cohesive room or building design derived from a collage of images.',
      spaces: ['Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Bathroom / Spa', 'Home Office', 'Office Lobby / Reception', 'Retail Store / Showroom', 'Restaurant / Cafe', 'Building Exterior', 'Landscape / Garden', 'Roof Terrace', 'Pavilion']
    },
    enhancer: {
      name: 'Render Enhancer',
      desc: 'Improve lighting, textures, and realism of an existing 3D render.',
      focus: ['Overall Realism', 'Texture Detail', 'Lighting & Shadows', 'Color Grading', 'Vegetation & Landscaping', 'Reflections & Transparency', 'Interior Atmosphere', 'Facade Details'],
      lighting: ['Natural Daylight', 'Golden Hour', 'Overcast', 'Cinematic Night', 'Studio Lighting', 'Blue Hour (Twilight)', 'Foggy / Misty', 'Rainy Mood', 'Cyberpunk / Neon', 'Northern Lights']
    },
    camera: {
      name: 'Camera Angle',
      desc: 'Re-imagine the scene from a different perspective using the virtual studio.'
    },
    closeup: {
      name: 'Close-Up Render',
      desc: 'Generate high-fidelity macro shots of specific details using the focus point.',
      details: ['Material Texture / Surface', 'Joinery / Structural Connection', 'Furniture Detail', 'Lighting Fixture', 'Decor Element / Art', 'Fabric / Textile Weave', 'Facade Cladding Detail'],
      bokeh: ['f/1.8 (Strong Bokeh / Blurry Background)', 'f/4.0 (Balanced Focus)', 'f/11 (Deep Focus / Sharp Everywhere)'],
      lighting: ['Soft Diffused (Studio)', 'Hard Contrast (Dramatic)', 'Rim Light (Edge Highlight)', 'Natural Daylight']
    },
    exterior: {
      name: 'Modify Exterior',
      desc: 'Change facade materials, landscaping, or time of day for building exteriors.',
      weather: ['Sunny Day', 'Overcast / Cloudy', 'Rainy / Wet Street', 'Snowy Winter', 'Foggy Morning', 'Golden Hour (Sunrise/Sunset)', 'Blue Hour (Twilight)', 'Clear Night with Stars', 'Stormy / Dramatic'],
      landscapes: ['Urban Street (City Center)', 'Suburban Neighborhood', 'Modern Garden / Manicured', 'Wild Forest / Nature', 'Desert Landscape', 'Coastal / Beachfront', 'Mountainous / Alpine', 'Minimalist Concrete Plaza']
    },
    interior: {
      name: 'Modify Interior',
      desc: 'Redecorate a room with new furniture styles, colors, or layout adjustments.',
      styles: ['Modern', 'Scandinavian', 'Industrial', 'Japandi', 'Art Deco', 'Mid-century Modern', 'Contemporary Luxury', 'Quiet Luxury', 'Minimalist Zen', 'Classic Traditional', 'Bohemian Chic', 'Rustic Farmhouse', 'Wabi-Sabi'],
      colors: ['Neutral / Earthy', 'Dark / Moody', 'Pastel', 'Monochrome', 'Vibrant', 'Warm Beige & Cream', 'Cool Grey & Blue', 'Black & Gold Accent', 'Forest Green & Wood', 'Terracotta & Clay']
    },
    facade: {
      name: '3D to Facade/Elevation',
      desc: 'Generate flat 2D orthographic technical drawings from 3D perspective images.',
      views: ['Front Elevation', 'Left Side Elevation', 'Right Side Elevation', 'Rear Elevation', 'Top-Down / Roof Plan', 'Full Presentation Layout (All Elevations)'],
      styles: ['Technical Line Drawing', 'CAD Blueprint (White on Blue)', 'Colored Elevation (Rendered)', 'Artistic Hand-Drafted']
    },
    presentation: {
      name: 'Presentation Board',
      desc: 'Create a full architectural presentation sheet with plans, sections, and evolution diagrams.',
      layouts: ['Academic Grid', 'Competition Style (Asymmetrical)', 'Minimalist Portfolio', 'Technical Sheet'],
      backgrounds: ['Clean White', 'Textured Parchment', 'Elegant Dark (Portfolio)', 'Matte Black', 'Charcoal Grey', 'Deep Midnight', 'Dark Mode / Blueprint', 'Subtle Gradient']
    },
    upscale: {
      name: 'Upscale',
      desc: 'Regenerate the image at maximum resolution with enhanced details.',
      sharpness: ['Balanced', 'Soft/Cinematic', 'Ultra Sharp']
    },
    xray: {
      name: 'X-Ray Section',
      desc: 'Visualize the internal structure or creating a cutaway section view.',
      cuts: ['Vertical Section', 'Horizontal Plan', 'Perspective Cutaway']
    }
  },
  vi: {
    customPrompt: 'Tùy chỉnh Prompt',
    renderStyle: 'Phong cách Render',
    materialHint: 'Gợi ý Vật liệu',
    creativity: 'Mức độ Sáng tạo',
    sketchStyle: 'Kiểu Phác thảo',
    lineWeight: 'Độ dày nét',
    spaceType: 'Loại Không gian',
    styleCohesion: 'Độ đồng nhất',
    enhancementFocus: 'Trọng tâm Xử lý',
    lightingCondition: 'Điều kiện Ánh sáng',
    cameraStudio: 'Studio Camera',
    focusPoint: 'Điểm Lấy nét',
    zoomCrop: 'Mức độ Zoom / Crop',
    detailFocus: 'Chi tiết Cần nét',
    dof: 'Độ sâu trường ảnh (DOF)',
    macroLight: 'Ánh sáng Macro',
    weatherTime: 'Thời tiết / Thời gian',
    landscape: 'Bối cảnh Cảnh quan',
    designStyle: 'Phong cách Thiết kế',
    colorPalette: 'Bảng màu',
    targetView: 'Góc nhìn Mục tiêu',
    drawingStyle: 'Phong cách Bản vẽ',
    layoutComp: 'Bố cục Trình bày',
    bgStyle: 'Kiểu Nền',
    detailSharpness: 'Độ sắc nét',
    cutType: 'Kiểu Cắt mặt cắt',
    sketchToImage: {
      name: 'Phác thảo thành Ảnh',
      desc: 'Chuyển đổi bản vẽ tay hoặc nét CAD thành hình ảnh thực tế.',
      styles: ['Thực tế (Photorealistic)', 'Tối giản (Minimalist)', 'Thô mộc (Brutalist)', 'Hiện đại (Modern)', 'Concept Art', 'Màu nước', 'Cyberpunk / Sci-Fi', 'Industrial / Lo-Fi', 'Điện ảnh (Cinematic)', 'Mực tàu (Ink)', 'Phấn tiên (Pastel)', 'Sơn dầu'],
      materials: ['Bê tông & Kính', 'Gạch & Thép đen', 'Gỗ ấm & Đá', 'Thạch cao trắng & Gỗ sồi', 'Đá cẩm thạch & Đồng', 'Thép Corten & Bê tông', 'Cây xanh & Vườn đứng', 'Tre & Bền vững', 'Vách kính cường lực']
    },
    imageToSketch: {
      name: 'Ảnh thành Phác thảo',
      desc: 'Chuyển đổi ảnh chụp hoặc render thành bản phác thảo kỹ thuật hoặc nghệ thuật.',
      styles: ['Bản vẽ kỹ thuật (Blueprint)', 'Chì mềm (Loose Pencil)', 'Minh họa mực', 'Than chì (Charcoal)', 'Loang màu nước', 'Bút dạ (Marker)', 'Phác thảo tay', 'Concept Kiến trúc']
    },
    moodboard: {
      name: 'Moodboard thành Render',
      desc: 'Tạo thiết kế không gian thống nhất từ các hình ảnh moodboard.',
      spaces: ['Phòng khách', 'Phòng ngủ', 'Nhà bếp', 'Phòng ăn', 'Phòng tắm / Spa', 'Phòng làm việc', 'Sảnh văn phòng / Lễ tân', 'Cửa hàng / Showroom', 'Nhà hàng / Cafe', 'Ngoại thất tòa nhà', 'Cảnh quan / Sân vườn', 'Sân thượng', 'Gian hàng (Pavilion)']
    },
    enhancer: {
      name: 'Nâng cấp Render',
      desc: 'Cải thiện ánh sáng, vật liệu và độ chân thực của ảnh render 3D.',
      focus: ['Độ chân thực tổng thể', 'Chi tiết vật liệu', 'Ánh sáng & Bóng đổ', 'Chỉnh màu (Color Grading)', 'Cây xanh & Cảnh quan', 'Phản xạ & Độ trong suốt', 'Không khí nội thất', 'Chi tiết mặt tiền'],
      lighting: ['Ánh sáng ban ngày', 'Giờ vàng (Golden Hour)', 'Trời âm u', 'Đêm điện ảnh', 'Ánh sáng Studio', 'Giờ xanh (Chập tối)', 'Sương mù', 'Tâm trạng Mưa', 'Cyberpunk / Neon', 'Cực quang']
    },
    camera: {
      name: 'Góc chụp Camera',
      desc: 'Tái hiện công trình từ một góc nhìn hoàn toàn mới bằng studio ảo.'
    },
    closeup: {
      name: 'Render Cận cảnh',
      desc: 'Tạo ảnh macro độ nét cao cho các chi tiết cụ thể tại điểm lấy nét.',
      details: ['Bề mặt vật liệu', 'Liên kết / Cấu tạo', 'Chi tiết nội thất', 'Đèn / Chiếu sáng', 'Đồ Decor / Nghệ thuật', 'Vải / Dệt may', 'Chi tiết ốp mặt tiền'],
      bokeh: ['f/1.8 (Xóa phông mạnh)', 'f/4.0 (Cân bằng)', 'f/11 (Nét sâu / Rõ toàn bộ)'],
      lighting: ['Ánh sáng tản (Studio)', 'Tương phản cao', 'Ánh sáng ven (Rim Light)', 'Ánh sáng tự nhiên']
    },
    exterior: {
      name: 'Chỉnh sửa Ngoại thất',
      desc: 'Thay đổi vật liệu mặt tiền, cảnh quan hoặc thời gian trong ngày.',
      weather: ['Ngày nắng', 'Nhiều mây / Âm u', 'Mưa / Đường ướt', 'Tuyết mùa đông', 'Sương sớm', 'Bình minh / Hoàng hôn', 'Chập tối (Blue Hour)', 'Đêm đầy sao', 'Bão / Kịch tính'],
      landscapes: ['Đô thị / Trung tâm', 'Khu dân cư ngoại ô', 'Sân vườn hiện đại', 'Rừng tự nhiên', 'Sa mạc', 'Bờ biển / Resort', 'Đồi núi', 'Quảng trường bê tông']
    },
    interior: {
      name: 'Chỉnh sửa Nội thất',
      desc: 'Thiết kế lại phòng với phong cách nội thất, màu sắc hoặc bố trí mới.',
      styles: ['Hiện đại', 'Bắc Âu (Scandinavian)', 'Công nghiệp (Industrial)', 'Japandi', 'Art Deco', 'Mid-century Modern', 'Sang trọng Đương đại', 'Quiet Luxury (Sang trọng kín đáo)', 'Minimalist Zen', 'Cổ điển Truyền thống', 'Bohemian Chic', 'Rustic Farmhouse', 'Wabi-Sabi'],
      colors: ['Trung tính / Màu đất', 'Tối / Moody', 'Pastel', 'Đơn sắc (Monochrome)', 'Rực rỡ', 'Be ấm & Kem', 'Xám lạnh & Xanh', 'Đen & Điểm nhấn Vàng', 'Xanh rừng & Gỗ', 'Đất nung & Gốm']
    },
    facade: {
      name: '3D thành Mặt đứng',
      desc: 'Tạo bản vẽ kỹ thuật 2D phẳng từ hình ảnh phối cảnh 3D.',
      views: ['Mặt đứng Chính', 'Mặt đứng Trái', 'Mặt đứng Phải', 'Mặt đứng Sau', 'Mặt bằng Mái', 'Bố cục Toàn bộ (Tất cả mặt)'],
      styles: ['Bản vẽ nét kỹ thuật', 'Bản vẽ xanh (Blueprint)', 'Mặt đứng Màu (Render)', 'Phác thảo tay nghệ thuật']
    },
    presentation: {
      name: 'Bảng Trình bày (Board)',
      desc: 'Tạo bảng presentation kiến trúc đầy đủ với mặt bằng, mặt cắt và sơ đồ.',
      layouts: ['Lưới Hàn lâm', 'Phong cách Thi tuyển', 'Portfolio Tối giản', 'Bản vẽ Kỹ thuật'],
      backgrounds: ['Trắng sạch', 'Giấy giả cổ', 'Tối sang trọng (Portfolio)', 'Đen nhám', 'Xám than', 'Xanh đêm thẫm', 'Chế độ tối / Blueprint', 'Gradient nhẹ']
    },
    upscale: {
      name: 'Upscale (Nâng cao)',
      desc: 'Tăng độ phân giải ảnh lên tối đa với chi tiết sắc nét hơn.',
      sharpness: ['Cân bằng', 'Mềm mại / Điện ảnh', 'Siêu sắc nét']
    },
    xray: {
      name: 'Mặt cắt X-Ray',
      desc: 'Trực quan hóa cấu trúc bên trong hoặc tạo phối cảnh mặt cắt.',
      cuts: ['Mặt cắt đứng', 'Mặt bằng cắt ngang', 'Phối cảnh cắt bổ']
    }
  }
};

export const getTools = (lang: Language): ToolDefinition[] => {
  const t = DICT[lang];
  const custom = t.customPrompt;

  return [
    {
      id: ToolId.SKETCH_TO_IMAGE,
      name: t.sketchToImage.name,
      description: t.sketchToImage.desc,
      icon: 'PenTool',
      promptTemplate: 'Photorealistic architectural render based on this sketch. Style: ${style}. Material focus: ${material}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '2K',
      options: [
        { 
          id: 'style', 
          label: t.renderStyle, 
          type: 'select', 
          options: [...t.sketchToImage.styles, custom], 
          defaultValue: t.sketchToImage.styles[0] 
        },
        { 
          id: 'material', 
          label: t.materialHint, 
          type: 'select', 
          options: [...t.sketchToImage.materials, custom],
          defaultValue: t.sketchToImage.materials[0] 
        },
        { id: 'creativity', label: t.creativity, type: 'slider', min: 0, max: 100, step: 10, defaultValue: 30, suffix: '%' }
      ]
    },
    {
      id: ToolId.IMAGE_TO_SKETCH,
      name: t.imageToSketch.name,
      description: t.imageToSketch.desc,
      icon: 'Image',
      promptTemplate: 'Architectural sketch style of this image. Style: ${style}. Line weight: ${weight}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL, 
      options: [
        { id: 'style', label: t.sketchStyle, type: 'select', options: t.imageToSketch.styles, defaultValue: t.imageToSketch.styles[1] },
        { id: 'weight', label: t.lineWeight, type: 'slider', min: 1, max: 10, step: 1, defaultValue: 3 }
      ]
    },
    {
      id: ToolId.MOODBOARD_TO_RENDER,
      name: t.moodboard.name,
      description: t.moodboard.desc,
      icon: 'LayoutTemplate',
      promptTemplate: 'Create a cohesive architectural design for a ${roomType}. Style derived from moodboard. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '2K',
      options: [
        { 
          id: 'roomType', 
          label: t.spaceType, 
          type: 'select', 
          options: [...t.moodboard.spaces, custom], 
          defaultValue: t.moodboard.spaces[0] 
        },
        { id: 'cohesion', label: t.styleCohesion, type: 'slider', min: 0, max: 100, defaultValue: 80, suffix: '%' }
      ]
    },
    {
      id: ToolId.RENDER_ENHANCER,
      name: t.enhancer.name,
      description: t.enhancer.desc,
      icon: 'Sparkles',
      promptTemplate: 'Enhance this architectural render. Focus on ${focus}. Lighting condition: ${lighting}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '2K',
      options: [
        { 
          id: 'focus', 
          label: t.enhancementFocus, 
          type: 'select', 
          options: [...t.enhancer.focus, custom], 
          defaultValue: t.enhancer.focus[0] 
        },
        { 
          id: 'lighting', 
          label: t.lightingCondition, 
          type: 'select', 
          options: [...t.enhancer.lighting, custom], 
          defaultValue: t.enhancer.lighting[0] 
        }
      ]
    },
    {
      id: ToolId.CAMERA_ANGLE,
      name: t.camera.name,
      description: t.camera.desc,
      icon: 'Camera',
      promptTemplate: 'TASK: 3D ARCHITECTURAL RECONSTRUCTION. Input Image is a STYLE and MATERIAL reference only. \nOBJECTIVE: Render the exact same building design from a COMPLETELY NEW CAMERA ANGLE. \n\nTARGET VIEW CONFIGURATION:\n${cameraInstruction}\n\nINSTRUCTIONS:\n1. Mentally reconstruct the 3D geometry of the building.\n2. Rotate the virtual camera to the Target View defined above.\n3. IGNORE the original perspective/composition of the input image. Do not just crop or warp.\n4. Ensure materials (concrete, glass, wood) match the reference.\n5. If the new angle reveals a "blind side" (e.g. rear), hallucinate plausible architectural details matching the front style.\n\n${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      options: [
        { id: 'cameraControl', label: t.cameraStudio, type: 'camera-studio', defaultValue: 0 }
      ]
    },
    {
      id: ToolId.CLOSE_UP_RENDER,
      name: t.closeup.name,
      description: t.closeup.desc,
      icon: 'ZoomIn',
      promptTemplate: 'TASK: MACRO ARCHITECTURAL PHOTOGRAPHY.\nINPUT IMAGE IS THE EXACT FRAME.\n\nOBJECTIVE: Up-res surface textures while maintaining EXACT COMPOSITION.\nFOCUS SUBJECT: ${detailType}.\nLIGHTING: ${lighting}.\nDEPTH OF FIELD: ${bokeh}.\n\nSTRICT CONSTRAINTS:\n1. FRAMING IS LOCKED: Do not zoom in, do not zoom out. The borders of the input are the borders of the output.\n2. PRESERVE GEOMETRY: Do not move or reshape objects. Only enhance their surface resolution/materiality.\n3. DEPTH OF FIELD: Apply blur ONLY to existing depth planes. Do not hallucinate new foreground layers to force bokeh.\n4. TEXTURE FOCUS: Enhance micro-details (grain, bumps, imperfections) within the existing boundaries.\n\n${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '2K',
      options: [
        { 
          id: 'focusPoint', 
          label: t.focusPoint, 
          type: 'focus-point', 
          defaultValue: { x: 50, y: 50 } 
        },
        { 
          id: 'zoomLevel', 
          label: t.zoomCrop, 
          type: 'slider', 
          min: 1.5, 
          max: 5.0, 
          step: 0.1, 
          defaultValue: 2.5, 
          suffix: 'x' 
        },
        { 
          id: 'detailType', 
          label: t.detailFocus, 
          type: 'select', 
          options: t.closeup.details, 
          defaultValue: t.closeup.details[0] 
        },
        {
          id: 'bokeh',
          label: t.dof,
          type: 'select',
          options: t.closeup.bokeh,
          defaultValue: t.closeup.bokeh[1]
        },
        {
          id: 'lighting',
          label: t.macroLight,
          type: 'select',
          options: t.closeup.lighting,
          defaultValue: t.closeup.lighting[0]
        }
      ]
    },
    {
      id: ToolId.MODIFY_EXTERIOR,
      name: t.exterior.name,
      description: t.exterior.desc,
      icon: 'Home',
      promptTemplate: 'Modify building exterior. Weather/Time: ${weather}. Landscape context: ${landscape}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      options: [
        { 
          id: 'weather', 
          label: t.weatherTime, 
          type: 'select', 
          options: [...t.exterior.weather, custom], 
          defaultValue: t.exterior.weather[0] 
        },
        { 
          id: 'landscape', 
          label: t.landscape, 
          type: 'select', 
          options: [...t.exterior.landscapes, custom], 
          defaultValue: t.exterior.landscapes[2] 
        }
      ]
    },
    {
      id: ToolId.MODIFY_INTERIOR,
      name: t.interior.name,
      description: t.interior.desc,
      icon: 'Armchair',
      promptTemplate: 'Redesign interior. Design Style: ${style}. Color Palette: ${colors}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      options: [
        { 
          id: 'style', 
          label: t.designStyle, 
          type: 'select', 
          options: [...t.interior.styles, custom], 
          defaultValue: t.interior.styles[0] 
        },
        { 
          id: 'colors', 
          label: t.colorPalette, 
          type: 'select', 
          options: [...t.interior.colors, custom], 
          defaultValue: t.interior.colors[0] 
        }
      ]
    },
    {
      id: ToolId.FACADE_ELEVATION,
      name: t.facade.name,
      description: t.facade.desc,
      icon: 'PanelTop',
      promptTemplate: 'TASK: ORTHOGRAPHIC PROJECTION GENERATION.\nConvert the 3D perspective of the provided building into a FLAT, 2D TECHNICAL DRAWING.\n\nTARGET VIEW: ${view}.\nDRAWING STYLE: ${style}.\n\nINSTRUCTIONS:\n1. Remove all perspective distortion. Lines must be parallel (orthographic).\n2. Flatten the geometry to show the true elevation/plan.\n3. Maintain accurate architectural details (windows, doors, materials) but presented flat.\n4. If generating a Plan, assume a standard cut plane.\n5. IF "Full Presentation Layout" is requested: Arrange Front, Left, Right, Rear, and Top views on a single sheet in a grid.\n\n${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '4K',
      options: [
        { id: 'view', label: t.targetView, type: 'select', options: t.facade.views, defaultValue: t.facade.views[0] },
        { id: 'style', label: t.drawingStyle, type: 'select', options: t.facade.styles, defaultValue: t.facade.styles[2] }
      ]
    },
    {
      id: ToolId.PRESENTATION_BOARD,
      name: t.presentation.name,
      description: t.presentation.desc,
      icon: 'FileImage',
      promptTemplate: 'Create an architectural presentation board using the design of this building (Base Image).\n\nVISUAL STYLE: Based strictly on the visual template provided in the Reference Images (if any).\n\nREQUIRED COMPONENTS (Must be organized coherently on one sheet):\n1. Main Perspective: A high-quality axonometric or eye-level render.\n2. Technical Drawings: A clear Ground Floor Plan and a Cross-Section.\n3. MASSING EVOLUTION: Generate 5 small diagrams showing the step-by-step form evolution (Initial Block -> Subtraction/Addition -> Final Form).\n4. Diagrams: Add circulation or environmental arrows if appropriate.\n\nLAYOUT: ${layout}.\nBACKGROUND: ${background}.\nNOTE: IF Background is Dark, use white/light text and white linework for high contrast.\n\n${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '4K',
      options: [
        { id: 'layout', label: t.layoutComp, type: 'select', options: t.presentation.layouts, defaultValue: t.presentation.layouts[0] },
        { id: 'background', label: t.bgStyle, type: 'select', options: t.presentation.backgrounds, defaultValue: t.presentation.backgrounds[0] }
      ]
    },
    {
      id: ToolId.UPSCALE,
      name: t.upscale.name,
      description: t.upscale.desc,
      icon: 'Maximize',
      promptTemplate: 'High-resolution 4k render. Sharpen details, improve clarity. Sharpness focus: ${sharpness}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      imageSize: '4K',
      options: [
        { id: 'sharpness', label: t.detailSharpness, type: 'select', options: t.upscale.sharpness, defaultValue: t.upscale.sharpness[0] }
      ]
    },
    {
      id: ToolId.XRAY_SECTION,
      name: t.xray.name,
      description: t.xray.desc,
      icon: 'Layers',
      promptTemplate: 'Architectural x-ray section view. Cutaway perspective showing internal structure. Cut Type: ${cutType}. ${userPrompt}',
      model: HIGH_QUALITY_MODEL,
      options: [
        { id: 'cutType', label: t.cutType, type: 'select', options: t.xray.cuts, defaultValue: t.xray.cuts[2] }
      ]
    }
  ];
};