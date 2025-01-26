const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Controles de sliders
const gravitySlider = document.getElementById('gravitySlider');
const frictionSlider = document.getElementById('frictionSlider');
const wallFrictionSlider = document.getElementById('wallFrictionSlider');
const collisionDampingSlider = document.getElementById('collisionDampingSlider');
const bounceThresholdSlider = document.getElementById('bounceThresholdSlider');
const maxRadiusSlider = document.getElementById('maxRadiusSlider');

// Mostrar valores actuales
const gravityValue = document.getElementById('gravityValue');
const frictionValue = document.getElementById('frictionValue');
const wallFrictionValue = document.getElementById('wallFrictionValue');
const collisionDampingValue = document.getElementById('collisionDampingValue');
const bounceThresholdValue = document.getElementById('bounceThresholdValue');
const maxRadiusValue = document.getElementById('maxRadiusValue');

// Slider de FPS
const fpsSlider = document.getElementById('fpsSlider');
const fpsValue = document.getElementById('fpsValue');

// Checkbox para activar/desactivar modo debug
const debugCheckbox = document.getElementById('debugCheckbox');
const debugControls = document.getElementById('debugControls');

// Inicialización de valores físicos
let gravity = parseFloat(gravitySlider.value);
let friction = parseFloat(frictionSlider.value);
let wallFriction = parseFloat(wallFrictionSlider.value);
let collisionDamping = parseFloat(collisionDampingSlider.value);
let bounceThreshold = parseFloat(bounceThresholdSlider.value);
let maxRadius = parseFloat(maxRadiusSlider.value);
let fps = parseFloat(fpsSlider.value);

// Variables de control
let debugMode = false;

// Mostrar/ocultar controles de debug y el número dentro de las esferas
debugCheckbox.addEventListener('change', () => {
    debugMode = debugCheckbox.checked;
    debugControls.classList.toggle('hidden', !debugMode);
});

// Actualizar valores en tiempo real
gravitySlider.addEventListener('input', () => {
    gravity = parseFloat(gravitySlider.value);
    gravityValue.textContent = gravitySlider.value;
});
frictionSlider.addEventListener('input', () => {
    friction = parseFloat(frictionSlider.value);
    frictionValue.textContent = frictionSlider.value;
});
wallFrictionSlider.addEventListener('input', () => {
    wallFriction = parseFloat(wallFrictionSlider.value);
    wallFrictionValue.textContent = wallFrictionSlider.value;
});
collisionDampingSlider.addEventListener('input', () => {
    collisionDamping = parseFloat(collisionDampingSlider.value);
    collisionDampingValue.textContent = collisionDampingSlider.value;
});
bounceThresholdSlider.addEventListener('input', () => {
    bounceThreshold = parseFloat(bounceThresholdSlider.value);
    bounceThresholdValue.textContent = bounceThresholdSlider.value;
});
maxRadiusSlider.addEventListener('input', () => {
    maxRadius = parseFloat(maxRadiusSlider.value);
    maxRadiusValue.textContent = maxRadiusSlider.value;
});
fpsSlider.addEventListener('input', () => {
  fps = parseInt(fpsSlider.value);
  fpsValue.textContent = fpsSlider.value;
  interval = 1000 / fps;
});

let lastTime = 0;
let interval = 1000 / fps;
let spheres = [];

// Mapa de colores según el tamaño de la esfera
const sizeColorMap = {
    20: '#FF0000',  // Rojo para tamaño 20
    25: '#00FF00',  // Verde para tamaño 25
    30: '#0000FF',  // Azul para tamaño 30
    35: '#FFFF00',  // Amarillo para tamaño 35
    40: '#FF00FF',  // Morado para tamaño 40
    45: '#00FFFF',  // Cian para tamaño 45
    50: '#FFA500'   // Naranja para tamaño 50 (máximo)
};

// Clase para las esferas
class Sphere {
    constructor(x, radius) {
        this.x = x;
        this.y = 0; // Comienza desde la parte superior del canvas
        this.radius = radius;
        this.color = getColorForSize(radius); // Asignar color basado en el tamaño
        this.dy = 1; // Velocidad vertical inicial
        this.dx = 0; // Velocidad horizontal
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Mostrar el radio de la esfera en el centro si el modo debug está activado
        if (debugMode) {
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.radius, this.x, this.y + 4);
        }
    }

    update(deltaTime) {
        this.dy += gravity * deltaTime;
        this.x += this.dx * deltaTime;

        if (this.y + this.radius + this.dy * deltaTime > canvas.height) {
            this.y = canvas.height - this.radius;
            this.dy *= -friction;

            if (Math.abs(this.dy) < bounceThreshold) {
                this.dy = 0;
            }
        } else {
            this.y += this.dy * deltaTime;
        }

        if (this.x - this.radius <= 0) {
            this.x = this.radius;
            this.dx *= -wallFriction;
        } else if (this.x + this.radius >= canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx *= -wallFriction;
        }
    }

    checkCollision(otherSphere) {
        const distX = this.x - otherSphere.x;
        const distY = this.y - otherSphere.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        return distance < this.radius + otherSphere.radius;
    }

    resolveCollision(otherSphere) {
        const distX = otherSphere.x - this.x;
        const distY = otherSphere.y - this.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance === 0) return;

        const overlap = (this.radius + otherSphere.radius) - distance;

        // Normalizar el vector de colisión
        const normalX = distX / distance;
        const normalY = distY / distance;

        // Separar las esferas para evitar que se queden atascadas
        const moveX = normalX * overlap / 2;
        const moveY = normalY * overlap / 2;

        this.x -= moveX;
        this.y -= moveY;
        otherSphere.x += moveX;
        otherSphere.y += moveY;

        // Calcular velocidades relativas
        const relativeVelocityX = otherSphere.dx - this.dx;
        const relativeVelocityY = otherSphere.dy - this.dy;

        // Velocidad relativa proyectada sobre el vector de colisión
        const relativeNormalVelocity = relativeVelocityX * normalX + relativeVelocityY * normalY;

        // Si las esferas ya se están separando, no hacer nada
        if (relativeNormalVelocity > 0) return;

        // Coeficiente de restitución (amortiguación de colisión)
        const restitution = collisionDamping;

        // Separar las velocidades basadas en la colisión
        const impulse = (-(1 + restitution) * relativeNormalVelocity) / 2;

        // Aplicar los impulsos a ambas esferas
        this.dx -= impulse * normalX;
        this.dy -= impulse * normalY;
        otherSphere.dx += impulse * normalX;
        otherSphere.dy += impulse * normalY;
    }

    combine(otherSphere) {
        // Aumentar el radio de la esfera resultante y asignar un nuevo color
        this.radius = Math.min(this.radius + 5, maxRadius);
        this.color = getColorForSize(this.radius);
    }
}

// Obtener el color basado en el tamaño de la esfera
function getColorForSize(size) {
    return sizeColorMap[size] || '#FFFFFF'; // Blanco si no hay color definido
}

// Actualizar esferas y manejarlas
function updateSpheres(deltaTime) {
    for (let i = 0; i < spheres.length; i++) {
        let sphere = spheres[i];
        sphere.update(deltaTime);
        sphere.draw();

        for (let j = i + 1; j < spheres.length; j++) {
            let otherSphere = spheres[j];
            if (sphere.checkCollision(otherSphere)) {
                if (sphere.radius === otherSphere.radius) {
                    // Combinar esferas si son del mismo tamaño
                    sphere.combine(otherSphere);
                    spheres.splice(j, 1); // Eliminar la esfera combinada
                } else {
                    // Resolver la colisión si son de diferente tamaño
                    sphere.resolveCollision(otherSphere);
                }
            }
        }
    }
}

// Evento para generar una esfera al hacer click en el canvas
canvas.addEventListener('click', (event) => {
    const x = event.offsetX;
    const radius = Math.random() < 0.5 ? 20 : 25; // Elegir tamaño 20 o 25 de manera aleatoria
    spheres.push(new Sphere(x, radius));
});


// Animar el canvas
function animate(time) {
    const deltaTime = (time - lastTime) / interval;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
    updateSpheres(deltaTime); // Actualizar y dibujar esferas
    requestAnimationFrame(animate); // Continuar la animación
}

// Iniciar la animación
requestAnimationFrame(animate);
