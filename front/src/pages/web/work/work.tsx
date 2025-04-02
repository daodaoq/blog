import React, { useEffect, useRef } from "react";
import "./work.css";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

// 扩展 THREE.Line 类型
interface CustomLine extends THREE.Line {
  curve: THREE.Curve<THREE.Vector3>;
  letterElements: HTMLDivElement[];
}

const Work: React.FC = () => {
  const workSectionRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const lettersCanvasRef = useRef<HTMLCanvasElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !workSectionRef.current ||
      !cardsContainerRef.current ||
      !gridCanvasRef.current ||
      !lettersCanvasRef.current ||
      !textContainerRef.current
    ) {
      return;
    }

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const workSection = workSectionRef.current;
    const cardsContainer = cardsContainerRef.current;
    const gridCanvas = gridCanvasRef.current;
    const gridCtx = gridCanvas.getContext("2d");
    const lettersRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: lettersCanvasRef.current,
    });
    const textContainer = textContainerRef.current;

    const moveDistance = window.innerWidth * 5;
    let currentXPosition = 0;

    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const resizeGridCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      [gridCanvas.width, gridCanvas.height] = [
        window.innerWidth * dpr,
        window.innerHeight * dpr,
      ];
      [gridCanvas.style.width, gridCanvas.style.height] = [
        `${window.innerWidth}px`,
        `${window.innerHeight}px`,
      ];
      gridCtx?.scale(dpr, dpr);
    };
    resizeGridCanvas();

    const drawGrid = (scrollProgress = 0) => {
      if (!gridCtx) return;
      gridCtx.fillStyle = "white"; // 修改背景颜色为白色
      gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
      gridCtx.fillStyle = "#f40c3f";
      const [dotSize, spacing] = [1, 30];
      const [rows, cols] = [
        Math.ceil(gridCanvas.height / spacing),
        Math.ceil(gridCanvas.width / spacing) + 15,
      ];
      const offset = (scrollProgress * spacing * 10) % spacing;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          gridCtx.beginPath();
          gridCtx.arc(x * spacing - offset, y * spacing, dotSize, 0, Math.PI * 2);
          gridCtx.fill();
        }
      }
    };

    const lettersScene = new THREE.Scene();
    const lettersCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    lettersCamera.position.z = 20;

    lettersRenderer.setSize(window.innerWidth, window.innerHeight);
    lettersRenderer.setClearColor(0xffffff, 1); // 修改背景颜色为白色
    lettersRenderer.setPixelRatio(window.devicePixelRatio);

    const createTextAnimationPath = (yPos: number, amplitude: number): CustomLine => {
      const points = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        points.push(
          new THREE.Vector3(
            -25 + 50 * t,
            yPos + Math.sin(t * Math.PI) * -amplitude,
            (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5
          )
        );
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
        new THREE.LineBasicMaterial({ color: 0x000, linewidth: 1 })
      ) as unknown as CustomLine;
      line.curve = curve;
      line.letterElements = [];
      return line;
    };

    const path: CustomLine[] = [
      createTextAnimationPath(10, 2),
      createTextAnimationPath(3.5, 1),
      createTextAnimationPath(-3.5, 1),
      createTextAnimationPath(-10, -2),
    ];
    path.forEach((line) => lettersScene.add(line));

    const letterPositions = new Map<HTMLDivElement, { current: { x: number; y: number }; target: { x: number; y: number } }>();
    path.forEach((line, i) => {
      line.letterElements = Array.from({ length: 15 }, () => {
        const el = document.createElement("div");
        el.className = "letter";
        el.textContent = ["W", "O", "R", "K"][i];
        textContainer.appendChild(el);
        letterPositions.set(el, {
          current: { x: 0, y: 0 },
          target: { x: 0, y: 0 },
        });
        return el;
      });
    });

    const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
    const updateTargetPositions = (scrollProgress = 0) => {
      path.forEach((line: CustomLine, lineIndex: number) => {
        line.letterElements.forEach((element: HTMLDivElement, i: number) => {
          const point = line.curve.getPoint(
            (i / 14 + scrollProgress * lineSpeedMultipliers[lineIndex]) % 1
          );
          const vector = point.clone().project(lettersCamera);
          const positions = letterPositions.get(element);
          if (positions) {
            positions.target = {
              x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
              y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
            };
          }
        });
      });
    };

    const updateLetterPositions = () => {
      letterPositions.forEach((positions, element: HTMLDivElement) => {
        const distX = positions.target.x - positions.current.x;
        if (Math.abs(distX) > window.innerWidth * 0.7) {
          [positions.current.x, positions.current.y] = [
            positions.target.x,
            positions.target.y,
          ];
        } else {
          positions.current.x = lerp(positions.current.x, positions.target.x, 0.07);
          positions.current.y = lerp(positions.current.y, positions.target.y, 0.07);
        }
        element.style.transform = `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`;
      });
    };

    const updateCardsPosition = () => {
      const targetX = -moveDistance * (ScrollTrigger.getAll()[0]?.progress || 0);
      currentXPosition = lerp(currentXPosition, targetX, 0.07);
      gsap.set(cardsContainer, {
        x: currentXPosition,
      });
    };

    const animate = () => {
      updateLetterPositions();
      updateCardsPosition();
      lettersRenderer.render(lettersScene, lettersCamera);
      requestAnimationFrame(animate);
    };

    ScrollTrigger.create({
      trigger: workSection,
      start: "top top",
      end: "+=500%",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        updateTargetPositions(self.progress);
        drawGrid(self.progress);
      },
    });

    drawGrid(0);
    animate();
    updateTargetPositions(0);

    window.addEventListener("resize", () => {
      resizeGridCanvas();
      drawGrid(ScrollTrigger.getAll()[0]?.progress || 0);
      lettersCamera.aspect = window.innerWidth / window.innerHeight;
      lettersCamera.updateProjectionMatrix();
      lettersRenderer.setSize(window.innerWidth, window.innerHeight);
      updateTargetPositions(ScrollTrigger.getAll()[0]?.progress || 0);
    });

    return () => {
      window.removeEventListener("resize", () => { });
    };
  }, []);

  return (
    <section className="work" ref={workSectionRef}>
      <canvas id="grid-canvas" ref={gridCanvasRef}></canvas>
      <canvas id="letters-canvas" ref={lettersCanvasRef}></canvas>
      <div className="text-container" ref={textContainerRef}>
        <div className="letter-line"></div> {/* 添加一条线 */}
      </div>
      <div className="cards" ref={cardsContainerRef}>
        <div className="card">
          <div className="card-img">
            <img src="src\assets\img1.png" alt="Current Working Paper" />
          </div>
          <div className="card-copy">
            <p>Current Working Paper</p>
            <p>2025-2-27</p>
          </div>
        </div>
        <div className="card">
          <div className="card-img">
            <img src="src\assets\img2.png" alt="Online Judge" />
          </div>
          <div className="card-copy">
            <p>Online Judge</p>
            <p>2025-2-1</p>
          </div>
        </div>
        <div className="card">
          <div className="card-img">
            <img src="src\assets\img3.jpg" alt="RAG Project for Software Copyright" />
          </div>
          <div className="card-copy">
            <p>RAG Project for Software Copyright</p>
            <p>2025-1-5</p>
          </div>
        </div>
        <div className="card">
          <div className="card-img">
            <img src="src\assets\img4.png" alt="Audio Transformer based on Basic-Pitch" />
          </div>
          <div className="card-copy">
            <p>Audio Transformer based on Basic-Pitch</p>
            <p>2025-2-27</p>
          </div>
        </div>
        <div className="card">
          <div className="card-img">
            <img src="src\assets\img5.png" alt="Guitar fretboard recognition based on YOLO" />
          </div>
          <div className="card-copy">
            <p>Guitar fretboard recognition based on YOLO</p>
            <p>2024-9-14</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Work;