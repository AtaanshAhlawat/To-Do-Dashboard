import paper from 'paper';

export const initPaperAnimation = (canvasId) => {
  // Only run in browser environment
  if (typeof window === 'undefined') return () => {};

  // Set up paper.js
  paper.setup(canvasId);

  // Paper JS Variables
  let canvasWidth, canvasHeight, canvasMiddleX, canvasMiddleY;
  const shapeGroup = new paper.Group();
  let positionArray = [];

  // Initialize shapes
  const initializeShapes = () => {
    // Clear existing shapes
    shapeGroup.removeChildren();
    
    // Get canvas bounds
    getCanvasBounds();
    
    // Define shape paths (simplified from the original)
    const shapePathData = [
      'M231,352l445-156L600,0L452,54L331,3L0,48L231,352', 
      'M0,0l64,219L29,343l535,30L478,37l-133,4L0,0z',
      'M0,65l16,138l96,107l270-2L470,0L337,4L0,65z',
      'M333,0L0,94l64,219L29,437l570-151l-196-42L333,0',
      'M331.9,3.6l-331,45l231,304l445-156l-76-196l-148,54L331.9,3.6z',
      'M389,352l92-113l195-43l0,0l0,0L445,48l-80,1L122.7,0L0,275.2L162,297L389,352',
      'M 50 100 L 300 150 L 550 50 L 750 300 L 500 250 L 300 450 L 50 100',
      'M 700 350 L 500 350 L 700 500 L 400 400 L 200 450 L 250 350 L 100 300 L 150 50 L 350 100 L 250 150 L 450 150 L 400 50 L 550 150 L 350 250 L 650 150 L 650 50 L 700 150 L 600 250 L 750 250 L 650 300 L 700 350'
    ];

    // Create shapes
    for (let i = 0; i < shapePathData.length; i++) {
      if (i >= positionArray.length) break;
      
      // Create shape
      const headerShape = new paper.Path({
        strokeColor: 'rgba(255, 255, 255, 0.5)',
        strokeWidth: 2,
        parent: shapeGroup,
      });
      
      // Set path data
      headerShape.pathData = shapePathData[i];
      headerShape.scale(1.5);
      
      // Set path position
      headerShape.position = positionArray[i];
      
      // Random rotation speed
      headerShape.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
  };

  // Get canvas bounds
  const getCanvasBounds = () => {
    canvasWidth = paper.view.size.width;
    canvasHeight = paper.view.size.height;
    canvasMiddleX = canvasWidth / 2;
    canvasMiddleY = canvasHeight / 2;
    
    // Define positions for shapes
    positionArray = [
      new paper.Point(canvasMiddleX * 0.75, canvasHeight * 0.2),
      new paper.Point(canvasWidth * 0.15, canvasMiddleY),
      new paper.Point(canvasWidth * 0.7, canvasHeight * 0.25),
      new paper.Point(canvasWidth * 0.05, canvasMiddleY + 150),
      new paper.Point(canvasWidth * 0.4, canvasHeight * 0.15),
      new paper.Point(canvasWidth * 0.8, canvasHeight * 0.8),
      new paper.Point(canvasWidth * 0.9, canvasMiddleY - 100),
      new paper.Point(canvasMiddleX + 100, canvasMiddleY + 150)
    ];
  };

  // Handle window resize
  const handleResize = () => {
    paper.view.setViewSize(window.innerWidth, window.innerHeight);
    getCanvasBounds();
    
    // Update shape positions
    shapeGroup.children.forEach((child, i) => {
      if (i < positionArray.length) {
        child.position = positionArray[i];
      }
    });
    
    // Hide some shapes on smaller screens
    if (window.innerWidth < 700) {
      [2, 3, 5].forEach(i => {
        if (shapeGroup.children[i]) {
          shapeGroup.children[i].opacity = 0;
        }
      });
    } else {
      [2, 3, 5].forEach(i => {
        if (shapeGroup.children[i]) {
          shapeGroup.children[i].opacity = 1;
        }
      });
    }
  };

  // Initialize
  initializeShapes();
  
  // Set up animation
  paper.view.onFrame = (event) => {
    if (event.count % 2 === 0) { // Slow down animation
      shapeGroup.children.forEach(shape => {
        shape.rotate(shape.rotationSpeed || 0.1);
      });
    }
  };

  // Handle window resize
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial resize

  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    paper.view.off('frame');
    paper.project.clear();
  };
};
