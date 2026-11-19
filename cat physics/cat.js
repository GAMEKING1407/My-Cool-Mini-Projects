
const { Engine, Render, Runner, Bodies, Composite, Constraint, Mouse, MouseConstraint, Events, Body } = Matter;

const engine = Engine.create();
engine.constraintIterations = 6;

const world = engine.world;

const render = Render.create({
  element: document.body,
  engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent"
  }
});

Render.run(render);

const runner = Runner.create();
Runner.run(runner, engine);

function createSoftCat(centerX, centerY, radius = 85, fill = "#fab387", stroke = "#e69d6c") {
  const segments = 20;
  const stiffness = 0.55;
  const nodeRadius = 10;

  const softBody = Composite.create({ label: "Soft Cat" });
  const nodes = [];
  const group = Body.nextGroup(true);

  const centerNode = Bodies.circle(centerX, centerY, nodeRadius, {
    collisionFilter: { group },
    render: { visible: false }
  });

  Composite.add(softBody, centerNode);

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;

    const node = Bodies.circle(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
      nodeRadius,
      {
        friction: 0.6,
        restitution: 0.3,
        collisionFilter: { group },
        render: { visible: false }
      }
    );

    nodes.push(node);
    Composite.add(softBody, node);

    Composite.add(softBody, Constraint.create({
      bodyA: centerNode,
      bodyB: node,
      stiffness,
      damping: 0.25,
      render: { visible: false }
    }));
  }

  for (let i = 0; i < segments; i++) {
    const current = nodes[i];
    const next = nodes[(i + 1) % segments];
    const skip1 = nodes[(i + 2) % segments];
    const skip2 = nodes[(i + 3) % segments];
    const opposite = nodes[(i + 10) % segments];

    const constraints = [
      [current, next, 0.9],
      [current, skip1, stiffness],
      [current, skip2, stiffness * 0.85],
      [current, opposite, 0.45]
    ];

    for (const [bodyA, bodyB, strength] of constraints) {
      Composite.add(softBody, Constraint.create({
        bodyA,
        bodyB,
        stiffness: strength,
        damping: 0.25,
        render: { visible: false }
      }));
    }
  }

  return { composite: softBody, nodes, centerNode, radius, fill, stroke };
}

const cats = [
  createSoftCat(window.innerWidth * 0.3, 200, 80, "#fab387", "#e69d6c"),
  createSoftCat(window.innerWidth * 0.5, 120, 70, "#cba6f7", "#a682d6"),
  createSoftCat(window.innerWidth * 0.7, 220, 85, "#a6e3a1", "#82c27d")
];

const wallOptions = {
  isStatic: true,
  render: { visible: false }
};

let ground;
let leftWall;
let rightWall;

function createWalls() {
  if (ground) {
    Composite.remove(world, ground);
    Composite.remove(world, leftWall);
    Composite.remove(world, rightWall);
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

  Composite.add(world, [ground, leftWall, rightWall]);
}

Composite.add(world, cats.map(cat => cat.composite));
createWalls();

Events.on(render, "afterRender", () => {
  const ctx = render.context;

  cats.forEach(cat => {
    const { nodes, centerNode, fill, stroke, radius } = cat;
    const len = nodes.length;

    function drawRoundedEar(idx1, idx2, tipScale) {
      const p1 = nodes[idx1].position;
      const p2 = nodes[idx2].position;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const dirX = midX - centerNode.position.x;
      const dirY = midY - centerNode.position.y;

      const tipX = midX + dirX * tipScale;
      const tipY = midY + dirY * tipScale;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(tipX, tipY, p2.x, p2.y);
      ctx.closePath();

      ctx.fillStyle = fill;
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = stroke;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo((p1.x + midX) / 2, (p1.y + midY) / 2);
      ctx.quadraticCurveTo(
        midX + dirX * tipScale * 0.65,
        midY + dirY * tipScale * 0.65,
        (p2.x + midX) / 2,
        (p2.y + midY) / 2
      );
      ctx.closePath();

      ctx.fillStyle = "#f38ba8";
      ctx.fill();
    }

    drawRoundedEar(12, 14, 0.75);
    drawRoundedEar(16, 18, 0.75);

    ctx.beginPath();

    for (let i = 0; i < len; i++) {
      const curr = nodes[i].position;
      const next = nodes[(i + 1) % len].position;

      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;

      if (i === 0) {
        const prev = nodes[len - 1].position;
        ctx.moveTo(
          (prev.x + curr.x) / 2,
          (prev.y + curr.y) / 2
        );
      }

      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }

    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = stroke;
    ctx.stroke();

    const c = centerNode.position;
    const right = nodes[0].position;
    const bottom = nodes[5].position;
    const left = nodes[10].position;
    const top = nodes[15].position;

    const xAxis = {
      x: (right.x - left.x) / 2,
      y: (right.y - left.y) / 2
    };

    const yAxis = {
      x: (bottom.x - top.x) / 2,
      y: (bottom.y - top.y) / 2
    };

    const scaleFactor = Math.hypot(xAxis.x, xAxis.y) / 85;

    function mapPt(u, v) {
      return {
        x: c.x + u * xAxis.x + v * yAxis.x,
        y: c.y + u * xAxis.y + v * yAxis.y
      };
    }

    const leftEye = mapPt(-0.32, -0.1);
    const rightEye = mapPt(0.32, -0.1);

    const leftHighlight = mapPt(-0.35, -0.13);
    const rightHighlight = mapPt(0.29, -0.13);

    ctx.fillStyle = "#1e1e2e";
    ctx.beginPath();
    ctx.arc(leftEye.x, leftEye.y, 8 * scaleFactor, 0, Math.PI * 2);
    ctx.arc(rightEye.x, rightEye.y, 8 * scaleFactor, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(leftHighlight.x, leftHighlight.y, 3 * scaleFactor, 0, Math.PI * 2);
    ctx.arc(rightHighlight.x, rightHighlight.y, 3 * scaleFactor, 0, Math.PI * 2);
    ctx.fill();

    const noseTopL = mapPt(-0.07, 0.05);
    const noseTopR = mapPt(0.07, 0.05);
    const noseTip = mapPt(0, 0.13);

    ctx.fillStyle = "#f38ba8";
    ctx.beginPath();
    ctx.moveTo(noseTopL.x, noseTopL.y);
    ctx.lineTo(noseTopR.x, noseTopR.y);
    ctx.lineTo(noseTip.x, noseTip.y);
    ctx.closePath();
    ctx.fill();

    const mStartL = mapPt(-0.14, 0.15);
    const mCtrlL = mapPt(-0.07, 0.24);
    const mEndL = mapPt(0, 0.14);
    const mCtrlR = mapPt(0.07, 0.24);
    const mEndR = mapPt(0.14, 0.15);

    ctx.strokeStyle = "#1e1e2e";
    ctx.lineWidth = 3 * scaleFactor;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(mStartL.x, mStartL.y);
    ctx.quadraticCurveTo(mCtrlL.x, mCtrlL.y, mEndL.x, mEndL.y);
    ctx.quadraticCurveTo(mCtrlR.x, mCtrlR.y, mEndR.x, mEndR.y);
    ctx.stroke();

    const w1a = mapPt(-0.5, 0.05);
    const w1b = mapPt(-0.85, -0.02);
    const w2a = mapPt(-0.5, 0.14);
    const w2b = mapPt(-0.85, 0.16);

    const w3a = mapPt(0.5, 0.05);
    const w3b = mapPt(0.85, -0.02);
    const w4a = mapPt(0.5, 0.14);
    const w4b = mapPt(0.85, 0.16);

    ctx.lineWidth = 2 * scaleFactor;
    ctx.beginPath();

    ctx.moveTo(w1a.x, w1a.y);
    ctx.lineTo(w1b.x, w1b.y);

    ctx.moveTo(w2a.x, w2a.y);
    ctx.lineTo(w2b.x, w2b.y);

    ctx.moveTo(w3a.x, w3a.y);
    ctx.lineTo(w3b.x, w3b.y);

    ctx.moveTo(w4a.x, w4a.y);
    ctx.lineTo(w4b.x, w4b.y);

    ctx.stroke();
  });
});

const mouse = Mouse.create(render.canvas);

const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.3,
    render: { visible: false }
  }
});

Composite.add(world, mouseConstraint);
render.mouse = mouse;

window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;

  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;

  createWalls();
});
