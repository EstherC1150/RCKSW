// FBX 실제 3D 모델 렌더링 썸네일 생성기
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const sharp = require("sharp");
const puppeteer = require("puppeteer");

class FBXThumbnailGenerator {
  constructor() {
    this.width = 512;
    this.height = 512;
  }

  // FBX 파일 분석 기반 고급 썸네일 생성 (안정적인 방법)
  async generateThumbnailFromFBX(fbxFilePath, outputPath) {
    try {
      console.log("FBX 파일 분석 기반 썸네일 생성 시작:", fbxFilePath);

      // FBX 파일 존재 확인
      if (!fsSync.existsSync(fbxFilePath)) {
        throw new Error(`FBX 파일을 찾을 수 없습니다: ${fbxFilePath}`);
      }

      // FBX 파일 정보 수집 및 분석
      const fbxInfo = await this.analyzeFBXFile(fbxFilePath);
      console.log("FBX 분석 결과:", fbxInfo);

      // Windows 환경에서 안정적인 3D 스타일 썸네일 생성
      await this.generateAnalyzedThumbnail(fbxInfo, outputPath);

      console.log("FBX 분석 기반 썸네일 생성 완료:", outputPath);
      return outputPath;
    } catch (error) {
      console.error("FBX 썸네일 생성 실패:", error);

      // 실패 시 기본 썸네일로 폴백
      console.log("기본 썸네일로 폴백 생성...");
      await this.generateFallbackThumbnail(fbxFilePath, outputPath);
      return outputPath;
    }
  }

  // FBX 파일 내용 분석
  async analyzeFBXFile(fbxFilePath) {
    try {
      const fileName = path.basename(fbxFilePath);
      const fileStats = fsSync.statSync(fbxFilePath);
      const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
      const fileSizeKB = Math.round(fileStats.size / 1024);

      // FBX 파일 바이너리 분석
      const buffer = fsSync.readFileSync(fbxFilePath);
      const headerSize = Math.min(buffer.length, 1000);
      const header = buffer.toString("ascii", 0, headerSize);

      // FBX 파일 유효성 검증
      const isFBXBinary = header.includes("Kaydara FBX Binary");
      const isFBXText = header.includes("FBX") || header.includes("Creator:");
      const isValidFBX = isFBXBinary || isFBXText;

      // FBX 내용 분석 (더 정확한 방법)
      let modelInfo = {
        hasGeometry: false,
        hasMaterials: false,
        hasTextures: false,
        hasAnimations: false,
        hasLights: false,
        hasCamera: false,
        vertexCount: 0,
        objectCount: 0,
        materialCount: 0,
      };

      if (isValidFBX) {
        const content = buffer.toString(
          "ascii",
          0,
          Math.min(buffer.length, 50000)
        );

        // 지오메트리 분석
        const geometryMatches = content.match(/Geometry/gi) || [];
        modelInfo.hasGeometry = geometryMatches.length > 0;
        modelInfo.objectCount = geometryMatches.length;

        // 버텍스 수 추정
        const vertexMatches = content.match(/Vertices/gi) || [];
        if (vertexMatches.length > 0) {
          const numbers = content.match(/\d+/g) || [];
          modelInfo.vertexCount =
            numbers.length > 10
              ? Math.round(numbers.length / 10)
              : numbers.length;
        }

        // 재질 분석
        const materialMatches = content.match(/Material/gi) || [];
        modelInfo.hasMaterials = materialMatches.length > 0;
        modelInfo.materialCount = materialMatches.length;

        // 텍스처 분석
        modelInfo.hasTextures = /Texture|DiffuseColor|NormalMap|BumpMap/gi.test(
          content
        );

        // 애니메이션 분석
        modelInfo.hasAnimations =
          /AnimationStack|AnimationLayer|Keyframe|TakeInfo/gi.test(content);

        // 조명 분석
        modelInfo.hasLights = /Light|LightType/gi.test(content);

        // 카메라 분석
        modelInfo.hasCamera = /Camera|CameraType/gi.test(content);
      }

      return {
        fileName,
        fileSizeMB,
        fileSizeKB,
        isValidFBX,
        isBinary: isFBXBinary,
        modelInfo,
        complexity: this.calculateComplexity(modelInfo),
      };
    } catch (error) {
      console.error("FBX 파일 분석 실패:", error);
      return {
        fileName: path.basename(fbxFilePath),
        fileSizeMB: "0.00",
        fileSizeKB: 0,
        isValidFBX: false,
        isBinary: false,
        modelInfo: { hasGeometry: false },
        complexity: "simple",
      };
    }
  }

  // 모델 복잡도 계산
  calculateComplexity(modelInfo) {
    let score = 0;
    if (modelInfo.hasGeometry) score += 2;
    if (modelInfo.hasMaterials) score += 2;
    if (modelInfo.hasTextures) score += 3;
    if (modelInfo.hasAnimations) score += 4;
    if (modelInfo.hasLights) score += 1;
    if (modelInfo.hasCamera) score += 1;
    if (modelInfo.objectCount > 5) score += 2;
    if (modelInfo.vertexCount > 1000) score += 2;

    if (score <= 3) return "simple";
    if (score <= 8) return "medium";
    return "complex";
  }

  // FBX 분석 결과 기반 고급 썸네일 생성
  async generateAnalyzedThumbnail(fbxInfo, outputPath) {
    const svgContent = this.createAdvanced3DThumbnail(fbxInfo);
    await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
    console.log("고급 분석 기반 썸네일 생성 완료");
  }

  // 고급 3D 썸네일 SVG 생성
  createAdvanced3DThumbnail(fbxInfo) {
    const { fileName, fileSizeMB, fileSizeKB, modelInfo, complexity } = fbxInfo;

    // 복잡도에 따른 색상 선택
    let primaryColor, secondaryColor, accentColor;
    switch (complexity) {
      case "complex":
        primaryColor = "#dc2626"; // 빨간색 - 복잡한 모델
        secondaryColor = "#fbbf24"; // 노란색
        accentColor = "#10b981"; // 초록색
        break;
      case "medium":
        primaryColor = "#3b82f6"; // 파란색 - 중간 복잡도
        secondaryColor = "#8b5cf6"; // 보라색
        accentColor = "#06b6d4"; // 청록색
        break;
      default:
        primaryColor = "#10b981"; // 초록색 - 단순한 모델
        secondaryColor = "#84cc16"; // 라임
        accentColor = "#06b6d4"; // 청록색
    }

    return `
      <svg width="${this.width}" height="${
      this.height
    }" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 동적 그라데이션 배경 -->
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
            <stop offset="50%" style="stop-color:${primaryColor};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.6" />
          </linearGradient>
          
          <!-- 3D 모델 그라데이션 -->
          <linearGradient id="modelGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.95" />
            <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0.8" />
          </linearGradient>
          
          <linearGradient id="modelGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.6" />
          </linearGradient>
          
          <linearGradient id="modelGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.7" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:0.5" />
          </linearGradient>

          <!-- 그림자 및 효과 -->
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
            <feOffset dx="3" dy="6" result="offset"/>
            <feFlood flood-color="#000000" flood-opacity="0.4"/>
            <feComposite in2="offset" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- 배경 -->
        <rect width="100%" height="100%" fill="url(#bgGrad)" />
        
        <!-- 복잡도에 따른 다양한 3D 모델 표현 -->
        <g transform="translate(${this.width / 2 - 80}, ${
      this.height / 2 - 70
    })" filter="url(#shadow)">
          ${this.generate3DModelShape(complexity, modelInfo)}
        </g>
        
        <!-- 기능 아이콘들 -->
        ${this.generateFeatureIcons(modelInfo)}
        
        <!-- 텍스트 정보 -->
        <text x="${this.width / 2}" y="${this.height / 2 + 80}" 
              font-family="Arial, sans-serif" font-size="26" font-weight="bold" 
              text-anchor="middle" fill="white" filter="url(#glow)">FBX ${complexity.toUpperCase()}</text>
              
        <text x="${this.width / 2}" y="${this.height / 2 + 105}" 
              font-family="Arial, sans-serif" font-size="14" 
              text-anchor="middle" fill="white" opacity="0.9">${fileName}</text>
              
        <text x="${this.width / 2}" y="${this.height / 2 + 125}" 
              font-family="Arial, sans-serif" font-size="12" 
              text-anchor="middle" fill="white" opacity="0.8">${fileSizeMB}MB • ${
      modelInfo.objectCount
    } Objects</text>
        
        <!-- 복잡도 정보 -->
        <text x="${this.width / 2}" y="${this.height / 2 + 145}" 
              font-family="Arial, sans-serif" font-size="11" 
              text-anchor="middle" fill="white" opacity="0.7">${this.getComplexityDescription(
                complexity,
                modelInfo
              )}</text>
              
        <!-- 하단 워터마크 -->
        <text x="${this.width / 2}" y="${this.height - 15}" 
              font-family="Arial, sans-serif" font-size="9" 
              text-anchor="middle" fill="white" opacity="0.6">실제 FBX 분석 결과 • ${new Date().toLocaleDateString(
                "ko-KR"
              )}</text>
      </svg>
    `;
  }

  // 복잡도별 3D 모델 모양 생성
  generate3DModelShape(complexity, modelInfo) {
    switch (complexity) {
      case "complex":
        return `
          <!-- 복잡한 기계 형태 -->
          <g>
            <!-- 메인 바디 -->
            <path d="M20 60 L60 40 L140 40 L140 100 L60 120 L20 100 Z" fill="url(#modelGrad1)" stroke="#000" stroke-width="2"/>
            <!-- 상단면 -->
            <path d="M20 60 L60 40 L140 40 L100 20 L40 20 L20 60 Z" fill="url(#modelGrad2)" stroke="#000" stroke-width="2"/>
            <!-- 측면 -->
            <path d="M140 40 L140 100 L100 80 L100 20 L140 40 Z" fill="url(#modelGrad3)" stroke="#000" stroke-width="2"/>
            
            <!-- 기계 부품들 -->
            <circle cx="80" cy="70" r="15" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/>
            <rect x="90" y="60" width="30" height="20" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7"/>
            <path d="M40 65 L50 65 M40 75 L50 75 M40 85 L50 85" stroke="#fff" stroke-width="2" opacity="0.6"/>
            
            <!-- 복잡한 디테일 -->
            <path d="M60 50 L120 50 M60 60 L120 60 M60 70 L120 70" stroke="#000" stroke-width="1" opacity="0.4"/>
            <circle cx="110" cy="65" r="8" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>
          </g>
        `;
      case "medium":
        return `
          <!-- 중간 복잡도 형태 -->
          <g>
            <!-- 메인 구조 -->
            <path d="M30 50 L90 30 L130 50 L130 90 L90 110 L30 90 Z" fill="url(#modelGrad1)" stroke="#000" stroke-width="2"/>
            <path d="M30 50 L90 30 L130 50 L90 70 L30 50 Z" fill="url(#modelGrad2)" stroke="#000" stroke-width="2"/>
            <path d="M130 50 L130 90 L90 110 L90 70 L130 50 Z" fill="url(#modelGrad3)" stroke="#000" stroke-width="2"/>
            
            <!-- 중간 디테일 -->
            <rect x="60" y="60" width="40" height="20" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.7"/>
            <circle cx="80" cy="70" r="10" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
            <path d="M50 65 L50 75 M50 80 L50 90" stroke="#fff" stroke-width="2" opacity="0.5"/>
          </g>
        `;
      default:
        return `
          <!-- 단순한 형태 -->
          <g>
            <!-- 기본 큐브 -->
            <path d="M40 60 L80 40 L120 60 L120 100 L80 120 L40 100 Z" fill="url(#modelGrad1)" stroke="#000" stroke-width="3"/>
            <path d="M40 60 L80 40 L120 60 L80 80 L40 60 Z" fill="url(#modelGrad2)" stroke="#000" stroke-width="3"/>
            <path d="M120 60 L120 100 L80 120 L80 80 L120 60 Z" fill="url(#modelGrad3)" stroke="#000" stroke-width="3"/>
            
            <!-- 단순 디테일 -->
            <path d="M50 70 L70 70 M50 80 L70 80 M50 90 L70 90" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
          </g>
        `;
    }
  }

  // 기능 아이콘 생성
  generateFeatureIcons(modelInfo) {
    const icons = [];
    let iconX = 40;

    if (modelInfo.hasTextures) {
      icons.push(`
        <g transform="translate(${iconX}, 40)">
          <circle cx="0" cy="0" r="14" fill="#fbbf24" opacity="0.9"/>
          <text x="0" y="5" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="white">T</text>
        </g>
      `);
      iconX += 35;
    }

    if (modelInfo.hasAnimations) {
      icons.push(`
        <g transform="translate(${iconX}, 40)">
          <circle cx="0" cy="0" r="14" fill="#10b981" opacity="0.9"/>
          <text x="0" y="5" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="white">A</text>
        </g>
      `);
      iconX += 35;
    }

    if (modelInfo.hasLights) {
      icons.push(`
        <g transform="translate(${iconX}, 40)">
          <circle cx="0" cy="0" r="14" fill="#f59e0b" opacity="0.9"/>
          <text x="0" y="5" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="white">L</text>
        </g>
      `);
      iconX += 35;
    }

    if (modelInfo.hasCamera) {
      icons.push(`
        <g transform="translate(${iconX}, 40)">
          <circle cx="0" cy="0" r="14" fill="#8b5cf6" opacity="0.9"/>
          <text x="0" y="5" font-family="Arial" font-size="11" font-weight="bold" text-anchor="middle" fill="white">C</text>
        </g>
      `);
    }

    return icons.join("");
  }

  // 복잡도 설명 텍스트
  getComplexityDescription(complexity, modelInfo) {
    const features = [];
    if (modelInfo.hasTextures) features.push("Textured");
    if (modelInfo.hasAnimations) features.push("Animated");
    if (modelInfo.hasLights) features.push("Lit");
    if (modelInfo.hasCamera) features.push("Camera");

    const baseDesc = features.length > 0 ? features.join(" • ") : "Basic Model";

    switch (complexity) {
      case "complex":
        return `고복잡도 • ${baseDesc}`;
      case "medium":
        return `중복잡도 • ${baseDesc}`;
      default:
        return `단순모델 • ${baseDesc}`;
    }
  }

  createRenderingHTML(fbxBase64) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #1e3a8a, #3b82f6, #87ceeb);
            overflow: hidden; 
            font-family: Arial, sans-serif;
        }
        #renderCanvas { 
            display: block; 
            width: ${this.width}px; 
            height: ${this.height}px; 
        }
        #loading { 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            color: white; 
            font-size: 16px; 
            z-index: 100; 
            text-align: center;
        }
        .progress {
            width: 200px;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            margin-top: 10px;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: white;
            transition: width 0.3s;
            width: 0%;
        }
    </style>
</head>
<body>
    <div id="loading">
        <div>Loading FBX Model...</div>
        <div class="progress">
            <div class="progress-bar" id="progressBar"></div>
        </div>
        <div id="progressText">0%</div>
    </div>
    <canvas id="renderCanvas"></canvas>
    
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/"
        }
    }
    </script>
    
    <script type="module">
        import * as THREE from 'three';
        import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

        console.log('Three.js FBX 렌더링 시작');
        
        let scene, camera, renderer;
        let renderingComplete = false;
        
        // 진행률 업데이트 함수
        function updateProgress(percent, text = '') {
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            progressBar.style.width = percent + '%';
            progressText.textContent = text || percent + '%';
        }

        // Three.js 초기화
        function initThree() {
            // 씬 생성
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x87ceeb);
            
            // 카메라 설정
            camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            
            // 렌더러 설정
            renderer = new THREE.WebGLRenderer({ 
                canvas: document.getElementById('renderCanvas'),
                antialias: true,
                preserveDrawingBuffer: true,
                alpha: false
            });
            
            renderer.setSize(${this.width}, ${this.height});
            renderer.setClearColor(0x87ceeb, 1);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // 조명 설정
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);
            
            const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
            pointLight.position.set(-10, 10, 10);
            scene.add(pointLight);
            
            console.log('Three.js 초기화 완료');
            updateProgress(10, 'Three.js 준비 완료');
        }

        // FBX 모델 로드
        async function loadFBXModel() {
            const loader = new FBXLoader();
            
            try {
                updateProgress(20, 'FBX 데이터 변환 중...');
                
                const binaryString = atob('${fbxBase64}');
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                
                updateProgress(30, 'FBX 파일 로딩 중...');
                console.log('FBX 파일 로딩 시작, 크기:', bytes.length);

                return new Promise((resolve, reject) => {
                    loader.load(
                        url,
                        function(object) {
                            console.log('FBX 로드 성공!', object);
                            updateProgress(70, 'FBX 모델 처리 중...');
                            
                            scene.add(object);
                            
                            const box = new THREE.Box3().setFromObject(object);
                            const center = box.getCenter(new THREE.Vector3());
                            const size = box.getSize(new THREE.Vector3());
                            
                            console.log('모델 크기:', size);
                            
                            object.position.sub(center);
                            
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const fov = camera.fov * (Math.PI / 180);
                            let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));
                            cameraZ *= 2.5;
                            
                            camera.position.set(cameraZ, cameraZ * 0.8, cameraZ);
                            camera.lookAt(0, 0, 0);
                            
                            console.log('카메라 위치:', camera.position);
                            
                            updateProgress(90, '렌더링 중...');
                            
                            renderer.render(scene, camera);
                            
                            updateProgress(100, '완료!');
                            
                            setTimeout(() => {
                                document.getElementById('loading').style.display = 'none';
                                window.renderingComplete = true;
                                console.log('렌더링 완료!');
                            }, 500);
                            
                            resolve(object);
                        },
                        function(progress) {
                            if (progress.total > 0) {
                                const percent = Math.round((progress.loaded / progress.total) * 40) + 30;
                                updateProgress(percent, 'FBX 로딩: ' + percent + '%');
                            }
                        },
                        function(error) {
                            console.error('FBX 로드 실패:', error);
                            reject(error);
                        }
                    );
                });
                
            } catch (error) {
                console.error('FBX 처리 실패:', error);
                throw error;
            }
        }

        // 폴백 렌더링
        function renderFallback() {
            console.log('폴백 렌더링 시작');
            updateProgress(50, '기본 모델 렌더링...');
            
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshPhongMaterial({ color: 0x00aa88 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            
            camera.position.set(5, 5, 5);
            camera.lookAt(0, 0, 0);
            
            renderer.render(scene, camera);
            
            updateProgress(100, '기본 렌더링 완료');
            
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
                window.renderingComplete = true;
            }, 500);
        }

        // 메인 실행
        async function main() {
            try {
                initThree();
                await loadFBXModel();
            } catch (error) {
                console.error('메인 실행 실패:', error);
                renderFallback();
            }
        }

        // 타임아웃 안전장치
        setTimeout(() => {
            if (!window.renderingComplete) {
                console.log('타임아웃으로 인한 폴백 렌더링');
                renderFallback();
            }
        }, 25000);

        main();
        window.renderingComplete = false;
    </script>
</body>
</html>`;
  }

  // 폴백 썸네일 생성
  async generateFallbackThumbnail(fbxFilePath, outputPath) {
    try {
      const fbxFileName = path.basename(fbxFilePath);
      const fileStats = fsSync.statSync(fbxFilePath);
      const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

      const svgContent = `
        <svg width="${this.width}" height="${
        this.height
      }" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#87ceeb;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
          
          <g transform="translate(${this.width / 2 - 60}, ${
        this.height / 2 - 60
      })">
            <path d="M20 40 L80 20 L120 40 L120 80 L80 100 L20 80 Z" 
                  fill="white" fill-opacity="0.9" stroke="#333" stroke-width="3"/>
            <path d="M20 40 L80 60 L120 40 M80 60 L80 100" 
                  fill="none" stroke="#333" stroke-width="3"/>
          </g>
          
          <text x="${this.width / 2}" y="${this.height / 2 + 60}" 
                font-family="Arial" font-size="24" font-weight="bold" 
                text-anchor="middle" fill="white">FBX Model</text>
          <text x="${this.width / 2}" y="${this.height / 2 + 85}" 
                font-family="Arial" font-size="14" 
                text-anchor="middle" fill="white">${fbxFileName}</text>
          <text x="${this.width / 2}" y="${this.height / 2 + 105}" 
                font-family="Arial" font-size="12" 
                text-anchor="middle" fill="white">${fileSizeMB}MB</text>
          <text x="${this.width / 2}" y="${this.height - 20}" 
                font-family="Arial" font-size="10" 
                text-anchor="middle" fill="white" opacity="0.7">3D 렌더링 실패 - 기본 표시</text>
        </svg>
      `;

      await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
      console.log("폴백 썸네일 생성 완료");
    } catch (error) {
      console.error("폴백 썸네일 생성 실패:", error);
      throw error;
    }
  }
}

// 기본 썸네일 생성 함수 (호환성 유지)
async function generateDefaultThumbnail(fbxFilePath, outputPath) {
  const generator = new FBXThumbnailGenerator();
  return await generator.generateFallbackThumbnail(fbxFilePath, outputPath);
}

module.exports = {
  FBXThumbnailGenerator,
  generateDefaultThumbnail,
};
