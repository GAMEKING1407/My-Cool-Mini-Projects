
const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Constraint,
  Mouse,
  MouseConstraint,
  Events,
  Body
} = Matter;

const engine = Engine.create();

engine.gravity.y = 1;
engine.gravity.scale = 0.001;

engine.constraintIterations = 12;
engine.positionIterations = 12;
engine.velocityIterations = 10;
engine.enableSleeping = false;

const world = engine.world;
const cats = [];

const render = Render.create({
  element: document.body,
  engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent",
    pixelRatio: window.devicePixelRatio
  }
});

Render.run(render);

const runner = Runner.create({
  delta: 1000 / 60,
  isFixed: true
});

Runner.run(runner, engine);

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function createSoftCat(
  centerX,
  centerY,
  radius = 85,
  fill = "#fab387",
  stroke = "#e69d6c",
  softness = 0.5
) {
  softness = clamp(softness, 0, 1);
  
  const segments = 24;
  const nodeRadius = Math.max(5, radius * 0.09);
  
  const stiffness = 0.98 - softness * 0.8;
  const damping = 0.5 - softness * 0.35;
  
  const softBody = Composite.create({
    label: "Soft Cat"
  });
  
  const nodes = [];
  const group = Body.nextGroup(true);
  
  const collisionOptions = {
    collisionFilter: {
      group,
      category: 0x0001,
      mask: 0xFFFFFFFF
    },
    friction: 0.7,
    frictionStatic: 0.9,
    restitution: 0.05,
    frictionAir: 0.015,
    density: 0.002,
    slop: 0.01,
    render: {
      visible: false
    }
  };
  
  const centerNode = Bodies.circle(
    centerX,
    centerY,
    nodeRadius,
    collisionOptions
  );
  
  Composite.add(softBody, centerNode);
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    
    const node = Bodies.circle(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
      nodeRadius,
      collisionOptions
    );
    
    nodes.push(node);
    Composite.add(softBody, node);
    
    Composite.add(
      softBody,
      Constraint.create({
        bodyA: centerNode,
        bodyB: node,
        stiffness,
        damping,
        render: {
          visible: false
        }
      })
    );
  }
  
  for (let i = 0; i < segments; i++) {
    const current = nodes[i];
    const next = nodes[(i + 1) % segments];
    const skip1 = nodes[(i + 2) % segments];
    const skip2 = nodes[(i + 3) % segments];
    const opposite = nodes[(i + 12) % segments];
    
    const constraints = [
      [current, next, 0.95],
      [current, skip1, stiffness * 0.9],
      [current, skip2, stiffness * 0.7],
      [current, opposite, stiffness * 0.4]
    ];
    
    for (const [bodyA, bodyB, strength] of constraints) {
      Composite.add(
        softBody,
        Constraint.create({
          bodyA,
          bodyB,
          stiffness: strength,
          damping,
          render: {
            visible: false
          }
        })
      );
    }
  }
  
  return {
    composite: softBody,
    nodes,
    centerNode,
    radius,
    fill,
    stroke,
    softness
  };
}

function spawnCat(
  x,
  y,
  radius = 85,
  fill = "#fab387",
  stroke = "#e69d6c",
  softness = 0.5
) {
  const cat = createSoftCat(
    x,
    y,
    radius,
    fill,
    stroke,
    softness
  );
  
  Composite.add(world, cat.composite);
  cats.push(cat);
  
  return cat;
}

const wallOptions = {
  isStatic: true,
  friction: 0.9,
  restitution: 0.1,
  render: {
    visible: false
  }
};

let ground;
let leftWall;
let rightWall;
let ceiling;

function createWalls() {
  if (ground) {
    Composite.remove(world, ground);
    Composite.remove(world, leftWall);
    Composite.remove(world, rightWall);
    Composite.remove(world, ceiling);
  }
  
  ground = Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight - 10,
    window.innerWidth,
    400,
    wallOptions
  );
  
  leftWall = Bodies.rectangle(
    -25,
    window.innerHeight / 2,
    50,
    window.innerHeight,
    wallOptions
  );
  
  rightWall = Bodies.rectangle(
    window.innerWidth + 25,
    window.innerHeight / 2,
    50,
    window.innerHeight,
    wallOptions
  );
  
  ceiling = Bodies.rectangle(
    window.innerWidth / 2,
    -25,
    window.innerWidth,
    50,
    wallOptions
  );
  
  Composite.add(world, [
    ground,
    leftWall,
    rightWall,
    ceiling
  ]);
}

function drawCatEar(
  ctx,
  nodes,
  center,
  idx1,
  idx2,
  fill,
  stroke
) {
  const p1 = nodes[idx1].position;
  const p2 = nodes[idx2].position;
  
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  
  const dirX = midX - center.x;
  const dirY = midY - center.y;
  
  const tipX = midX + dirX * 0.75;
  const tipY = midY + dirY * 0.75;
  
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  
  ctx.quadraticCurveTo(
    tipX,
    tipY,
    p2.x,
    p2.y
  );
  
  ctx.closePath();
  
  ctx.fillStyle = fill;
  ctx.fill();
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  
  ctx.beginPath();
  
  ctx.moveTo(
    (p1.x + midX) / 2,
    (p1.y + midY) / 2
  );
  
  ctx.quadraticCurveTo(
    midX + dirX * 0.5,
    midY + dirY * 0.5,
    (p2.x + midX) / 2,
    (p2.y + midY) / 2
  );
  
  ctx.closePath();
  
  ctx.fillStyle = "#f38ba8";
  ctx.fill();
}

function drawCat(cat, ctx) {
  const {
    nodes,
    centerNode,
    fill,
    stroke
  } = cat;
  
  const len = nodes.length;
  const center = centerNode.position;
  
  ctx.beginPath();
  
  for (let i = 0; i < len; i++) {
    const current = nodes[i].position;
    const next = nodes[(i + 1) % len].position;
    
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    
    if (i === 0) {
      const previous = nodes[len - 1].position;
      
      ctx.moveTo(
        (previous.x + current.x) / 2,
        (previous.y + current.y) / 2
      );
    }
    
    ctx.quadraticCurveTo(
      current.x,
      current.y,
      midX,
      midY
    );
  }
  
  ctx.closePath();
  
  ctx.fillStyle = fill;
  ctx.fill();
  
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  
  const right = nodes[0].position;
  const bottom = nodes[6].position;
  const left = nodes[12].position;
  const top = nodes[18].position;
  
  const xAxis = {
    x: (right.x - left.x) / 2,
    y: (right.y - left.y) / 2
  };
  
  const yAxis = {
    x: (bottom.x - top.x) / 2,
    y: (bottom.y - top.y) / 2
  };
  
  const scaleFactor = Math.max(
    0.3,
    Math.hypot(xAxis.x, xAxis.y) / 85
  );
  
  function mapPt(u, v) {
    return {
      x: center.x + u * xAxis.x + v * yAxis.x,
      y: center.y + u * xAxis.y + v * yAxis.y
    };
  }
  
  const leftEye = mapPt(-0.32, -0.1);
  const rightEye = mapPt(0.32, -0.1);
  
  const leftHighlight = mapPt(-0.35, -0.13);
  const rightHighlight = mapPt(0.29, -0.13);
  
  ctx.fillStyle = "#1e1e2e";
  ctx.beginPath();
  
  ctx.arc(
    leftEye.x,
    leftEye.y,
    8 * scaleFactor,
    0,
    Math.PI * 2
  );
  
  ctx.arc(
    rightEye.x,
    rightEye.y,
    8 * scaleFactor,
    0,
    Math.PI * 2
  );
  
  ctx.fill();
  
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  
  ctx.arc(
    leftHighlight.x,
    leftHighlight.y,
    3 * scaleFactor,
    0,
    Math.PI * 2
  );
  
  ctx.arc(
    rightHighlight.x,
    rightHighlight.y,
    3 * scaleFactor,
    0,
    Math.PI * 2
  );
  
  ctx.fill();
  
  const noseLeft = mapPt(-0.07, 0.05);
  const noseRight = mapPt(0.07, 0.05);
  const noseTip = mapPt(0, 0.13);
  
  ctx.fillStyle = "#f38ba8";
  ctx.beginPath();
  
  ctx.moveTo(noseLeft.x, noseLeft.y);
  ctx.lineTo(noseRight.x, noseRight.y);
  ctx.lineTo(noseTip.x, noseTip.y);
  
  ctx.closePath();
  ctx.fill();
  
  const mouthLeft = mapPt(-0.14, 0.15);
  const mouthMiddle = mapPt(0, 0.14);
  const mouthRight = mapPt(0.14, 0.15);
  
  const controlLeft = mapPt(-0.07, 0.24);
  const controlRight = mapPt(0.07, 0.24);
  
  ctx.strokeStyle = "#1e1e2e";
  ctx.lineWidth = 3 * scaleFactor;
  ctx.lineCap = "round";
  
  ctx.beginPath();
  
  ctx.moveTo(mouthLeft.x, mouthLeft.y);
  
  ctx.quadraticCurveTo(
    controlLeft.x,
    controlLeft.y,
    mouthMiddle.x,
    mouthMiddle.y
  );
  
  ctx.quadraticCurveTo(
    controlRight.x,
    controlRight.y,
    mouthRight.x,
    mouthRight.y
  );
  
  ctx.stroke();
  
  const whiskers = [
    [-0.5, 0.05, -0.85, -0.02],
    [-0.5, 0.14, -0.85, 0.16],
    [0.5, 0.05, 0.85, -0.02],
    [0.5, 0.14, 0.85, 0.16]
  ];
  
  ctx.lineWidth = 2 * scaleFactor;
  ctx.beginPath();
  
  for (const [x1, y1, x2, y2] of whiskers) {
    const start = mapPt(x1, y1);
    const end = mapPt(x2, y2);
    
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  }
  
  ctx.stroke();
  
  drawCatEar(ctx, nodes, center, 15, 17, fill, stroke);
  drawCatEar(ctx, nodes, center, 19, 21, fill, stroke);
  
}

Events.on(render, "afterRender", () => {
  const ctx = render.context;
  
  cats.forEach(cat => {
    drawCat(cat, ctx);
  });
});

const mouse = Mouse.create(render.canvas);

const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.3,
    damping: 0.1,
    render: {
      visible: false
    }
  }
});

Composite.add(world, mouseConstraint);
render.mouse = mouse;

createWalls();

spawnCat(
  window.innerWidth * 0.25,
  100,
  80,
  "#fab387",
  "#e69d6c",
  0.2
);

spawnCat(
  window.innerWidth * 0.45,
  100,
  70,
  "#cba6f7",
  "#a682d6",
  0.5
);

spawnCat(
  window.innerWidth * 0.65,
  100,
  85,
  "#a6e3a1",
  "#82c27d",
  0.8
);

spawnCat(
  window.innerWidth * 0.85,
  100,
  65,
  "#f4e784",
  "#eedc54",
  1
);

window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
  
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
  
  createWalls();
});
