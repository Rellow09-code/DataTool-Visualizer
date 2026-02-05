// =====================
// Scene Graph Classes
// =====================

// Base Node
class Node {
  constructor({ fillStyle = null, strokeStyle = '#000' } = {}) {
    this.fillStyle = fillStyle;
    this.strokeStyle = strokeStyle;
  }

  // Abstract – must be implemented by subclasses
  draw(ctx) {
    throw new Error('draw(ctx) must be implemented by Node subclasses');
  }

  applyStyle(ctx) {
    if (this.fillStyle !== null) ctx.fillStyle = this.fillStyle;
    if (this.strokeStyle !== null) ctx.strokeStyle = this.strokeStyle;
  }
}

// Transformed Object (with translation, rotation, scale)
class TransformedObject {
  constructor(node) {
    this.node = node;

    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    return this
  }

  translate(x,y){
    this.x = x;
    this.y = y;
    return this
  }
  scale(x,y){
    this.scaleX = x;
    this.scaleY = y;
    return this
  }
  rotate(rotation){
    this.rotation = rotation
    return this
  }

  draw(ctx) {
    ctx.save();

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);

    this.node.draw(ctx);

    ctx.restore();
  }
}

// Compound Object (just groups nodes)
class CompoundObject {
  constructor() {
    this.objects = [];
  }

  add(object) {
    this.objects.push(object);
  }

  remove(object) {
    this.objects = this.objects.filter(o => o !== object);
  }

  draw(ctx) {
    for (const obj of this.objects) {
      obj.draw(ctx);
    }
  }
}


// =====================
// Primitive Drawing Functions
// =====================

function rectangle(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.stroke();
}

function fillRectangle(ctx, x, y, width, height) {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fill();
}

function triangle(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.stroke();
}

function fillTriangle(ctx, x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function fillCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}