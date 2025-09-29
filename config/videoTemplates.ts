/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VideoMovementTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  musicStyle: string;
  duration: number;
  motionStrength: 'low' | 'medium' | 'high';
  icon: string;
}

export const videoMovementTemplates: VideoMovementTemplate[] = [
  {
    id: 'runway-walk',
    name: 'Runway Walk',
    description: 'Classic runway walk towards camera',
    prompt: `Create a professional runway fashion video from this model image. Transform this static photo into a sophisticated catwalk presentation.

**MOVEMENT STYLE - Professional Runway Walk:**
- Model walks confidently towards camera (classic runway style)
- Slow, deliberate steps with perfect posture
- Professional model attitude and expression
- Subtle head movement and shoulder sway
- Graceful arm movement, natural fashion posing
- Confident, elegant presentation throughout

**TECHNICAL SPECS:**
- MANDATORY: Perfect 9:16 vertical aspect ratio with ZERO black bars
- CROP AND SCALE: Intelligently crop the model to fill entire 9:16 frame
- FRAME FILLING: Every pixel of vertical space must be utilized
- 6-8 second duration with smooth loop
- Studio lighting maintained
- Smooth, cinematic motion
- Professional commercial quality
- NO LETTERBOXING OR PILLARBOXING ALLOWED`,
    musicStyle: 'Deep House / Fashion Week',
    duration: 8,
    motionStrength: 'medium',
    icon: '👠'
  },
  {
    id: 'spin-showcase',
    name: '360° Spin',
    description: 'Elegant turn to showcase the outfit',
    prompt: `Create a fashion showcase video with elegant 360° turn from this model image.

**MOVEMENT STYLE - Elegant Spin Showcase:**
- Model performs slow, graceful 360° turn
- Full outfit visibility from all angles
- Maintains eye contact with camera during turn
- Natural arm positioning during rotation
- Smooth, controlled spinning motion
- Professional fashion presentation attitude

**TECHNICAL SPECS:**
- MANDATORY: Perfect 9:16 vertical aspect ratio with ZERO black bars
- CROP AND SCALE: Intelligently crop the model to fill entire 9:16 frame
- FRAME FILLING: Every pixel of vertical space must be utilized
- 6-8 second complete rotation with smooth loop
- Studio lighting maintained
- Smooth rotational motion
- High-end fashion commercial quality
- NO LETTERBOXING OR PILLARBOXING ALLOWED`,
    musicStyle: 'Ambient Pop / Sophisticated',
    duration: 8,
    motionStrength: 'medium',
    icon: '🔄'
  },
  {
    id: 'pose-transition',
    name: 'Pose Flow',
    description: 'Smooth transitions between fashion poses',
    prompt: `Create a dynamic fashion video with smooth pose transitions from this model image.

**MOVEMENT STYLE - Fashion Pose Transitions:**
- Model transitions through 3-4 different fashion poses
- Fluid movement between poses
- Professional modeling expressions
- Natural hand and arm positioning changes
- Confident fashion attitude throughout
- Editorial-style pose presentation

**TECHNICAL SPECS:**
- MANDATORY: Perfect 9:16 vertical aspect ratio with ZERO black bars
- CROP AND SCALE: Intelligently crop the model to fill entire 9:16 frame
- FRAME FILLING: Every pixel of vertical space must be utilized
- 8-10 second duration with pose transitions
- Studio lighting maintained
- Smooth transitional movements
- High-fashion editorial quality
- NO LETTERBOXING OR PILLARBOXING ALLOWED`,
    musicStyle: 'Electronic Pop / Upbeat',
    duration: 10,
    motionStrength: 'high',
    icon: '✨'
  },
  {
    id: 'close-detail',
    name: 'Detail Focus',
    description: 'Close-up of clothing details and accessories',
    prompt: `Create a fashion detail showcase video focusing on clothing elements from this model image.

**MOVEMENT STYLE - Detail Focus Presentation:**
- Camera zooms in on key fashion details
- Model presents outfit elements naturally
- Gentle highlighting gestures toward accessories
- Subtle movement to showcase fabric texture
- Professional product presentation style
- Emphasis on craftsmanship and quality

**TECHNICAL SPECS:**
- MANDATORY: Perfect 9:16 vertical aspect ratio with ZERO black bars
- CROP AND SCALE: Intelligently crop the model to fill entire 9:16 frame
- FRAME FILLING: Every pixel of vertical space must be utilized
- 6-8 second detail showcase with smooth transitions
- Enhanced detail visibility
- Smooth zoom and focus movements
- Luxury fashion commercial quality
- NO LETTERBOXING OR PILLARBOXING ALLOWED`,
    musicStyle: 'Minimalist Electronica / Luxury',
    duration: 8,
    motionStrength: 'low',
    icon: '🔍'
  },
  {
    id: 'lifestyle-walk',
    name: 'Lifestyle Walk',
    description: 'Natural everyday style movement',
    prompt: `Create a lifestyle fashion video with natural walking movement from this model image.

**MOVEMENT STYLE - Natural Lifestyle Walk:**
- Model walks naturally with relaxed confidence
- Casual, approachable movement style
- Natural hair movement and fabric flow
- Authentic, lifestyle-focused presentation
- Comfortable, everyday elegance
- Relatable fashion storytelling

**TECHNICAL SPECS:**
- MANDATORY: Perfect 9:16 vertical aspect ratio with ZERO black bars
- CROP AND SCALE: Intelligently crop the model to fill entire 9:16 frame
- FRAME FILLING: Every pixel of vertical space must be utilized
- 8-10 second lifestyle presentation
- Natural lighting enhancement
- Organic, flowing movement
- Instagram lifestyle quality
- NO LETTERBOXING OR PILLARBOXING ALLOWED`,
    musicStyle: 'Indie Pop / Feel-Good',
    duration: 10,
    motionStrength: 'medium',
    icon: '🚶‍♀️'
  },
  {
    id: 'dramatic-entrance',
    name: 'Dramatic Entry',
    description: 'Bold entrance with dynamic movement',
    prompt: `Create a dramatic fashion entrance video with powerful movement from this model image.

**MOVEMENT STYLE - Dramatic Fashion Entrance:**
- Model makes commanding entrance toward camera
- Bold, confident movement with attitude
- Dynamic hair and fabric movement
- Strong fashion statement presentation
- Powerful, attention-grabbing motion
- High-impact visual storytelling

**TECHNICAL SPECS:**
- MANDATORY: Perfect 9:16 vertical aspect ratio with ZERO black bars
- CROP AND SCALE: Intelligently crop the model to fill entire 9:16 frame
- FRAME FILLING: Every pixel of vertical space must be utilized
- 6-8 second dramatic presentation
- Dynamic lighting effects
- Bold, impactful movement
- High-end fashion film quality
- NO LETTERBOXING OR PILLARBOXING ALLOWED`,
    musicStyle: 'Cinematic Pop / Dramatic',
    duration: 8,
    motionStrength: 'high',
    icon: '⚡'
  }
];

export const getTemplateById = (id: string): VideoMovementTemplate | undefined => {
  return videoMovementTemplates.find(template => template.id === id);
};

export const getDefaultTemplate = (): VideoMovementTemplate => {
  return videoMovementTemplates[0]; // Default to runway walk
};