"use client";

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stage, useFBX } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

declare global {
  interface Window {
    triggerThumbnailCapture?: (() => void) | null;
    onThumbnailCaptured?: ((dataUrl: string) => void) | null;
    isAutoCapture?: boolean;
  }
}

interface FbxThumbnailGeneratorProps {
  fbxFile?: File | null;
  fbxUrl?: string | null;
  onThumbnailGenerated: (thumbnailBase64: string) => void;
}

interface FbxThumbnailGeneratorRef {
  generateThumbnail: () => Promise<string | void> | void;
}

function FbxModel({ fbxUrl }: { fbxUrl: string }) {
  const modelRef = useRef<THREE.Group | null>(null);
  const fbx = useFBX(fbxUrl);

  useEffect(() => {
    if (!fbx) return;

    console.log("FBX 모델 로드됨:", fbx);

    // 기존 FbxViewer와 동일한 설정 적용
    fbx.scale.setScalar(0.01); // 고정 스케일
    fbx.rotation.set(-Math.PI / 2, 0, 0); // 기존과 동일한 회전

    console.log("FBX 모델 설정 완료 - 사용자 조작 가능");
  }, [fbx]);

  return <primitive ref={modelRef} object={fbx} />;
}

function ThumbnailCapture({
  onCapture,
}: {
  onCapture: (dataUrl: string) => void;
}) {
  const { gl } = useThree();
  const captureRef = useRef(false);

  useFrame(() => {
    if (captureRef.current) {
      // 한 프레임 후에 캡처 (모델이 완전히 렌더링된 후)
      setTimeout(() => {
        try {
          // 캔버스를 512x512 크기로 캡처
          const canvas = gl.domElement;
          const dataUrl = canvas.toDataURL("image/png");
          console.log(
            "📸 ThumbnailCapture: 캡처 완료, dataUrl 길이:",
            dataUrl.length
          );

          // 기본 콜백 실행
          onCapture(dataUrl);

          // 전역 콜백도 실행 (자동 캡처용)
          if (window.onThumbnailCaptured) {
            console.log(
              "🔄 전역 콜백 실행 - 타입:",
              typeof window.onThumbnailCaptured
            );
            const callback = window.onThumbnailCaptured;
            try {
              callback(dataUrl);
              console.log("✅ 전역 콜백 실행 완료");
              // 자동 캡처 후에만 null로 설정 (수동 캡처는 유지)
              if (window.isAutoCapture) {
                window.onThumbnailCaptured = null;
                window.isAutoCapture = false;
              }
            } catch (error) {
              console.error("❌ 전역 콜백 실행 실패:", error);
              window.onThumbnailCaptured = null;
              window.isAutoCapture = false;
            }
          } else {
            console.log(
              "⚠️ 전역 콜백이 설정되지 않음 - 현재 값:",
              window.onThumbnailCaptured
            );
          }

          captureRef.current = false;
        } catch (error) {
          console.error("썸네일 캡처 실패:", error);
        }
      }, 100);
    }
  });

  // 캡처 트리거 함수
  const triggerCapture = () => {
    captureRef.current = true;
  };

  // 부모 컴포넌트에서 호출할 수 있도록 함수 노출
  useEffect(() => {
    window.triggerThumbnailCapture = triggerCapture;
    return () => {
      // 언마운트 시 전역 레퍼런스 정리
      if (window.triggerThumbnailCapture === triggerCapture) {
        window.triggerThumbnailCapture = null;
      }
      window.onThumbnailCaptured = null;
      window.isAutoCapture = false;
    };
  }, []);

  return null;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4a90e2" />
    </mesh>
  );
}

const FbxThumbnailGenerator = forwardRef<
  FbxThumbnailGeneratorRef,
  FbxThumbnailGeneratorProps
>(({ fbxFile, fbxUrl: initialFbxUrl, onThumbnailGenerated }, ref) => {
  const [fbxUrl, setFbxUrl] = useState<string | null>(initialFbxUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);
  useImperativeHandle(ref, () => ({
    generateThumbnail: () => {
      return new Promise<string>((resolve) => {
        if (fbxUrl && window.triggerThumbnailCapture) {
          console.log("🎨 FbxThumbnailGenerator: generateThumbnail 실행");
          setIsGenerating(true);

          // 전역 캡처 완료 콜백을 임시로 설정
          window.onThumbnailCaptured = (dataUrl: string) => {
            handleCapture(dataUrl);
            resolve(dataUrl);
          };
          window.isAutoCapture = true; // 자동 캡처 플래그 설정

          // 캡처 실행
          window.triggerThumbnailCapture();
        } else {
          console.warn("⚠️ triggerThumbnailCapture 함수가 없습니다:", {
            fbxUrl: !!fbxUrl,
            triggerFn: !!window.triggerThumbnailCapture,
          });
          resolve(""); // 실패 시 빈 문자열 반환
        }
      });
    },
  }));

  useEffect(() => {
    if (fbxFile) {
      const url = URL.createObjectURL(fbxFile);
      setFbxUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (initialFbxUrl) {
      setFbxUrl(initialFbxUrl);
    } else {
      setFbxUrl(null);
    }
  }, [fbxFile, initialFbxUrl]);

  const handleCapture = (dataUrl: string) => {
    console.log(
      "🎯 FbxThumbnailGenerator: handleCapture 실행, dataUrl 길이:",
      dataUrl.length
    );
    setIsGenerating(false);
    onThumbnailGenerated(dataUrl);
  };

  if (!fbxUrl) {
    return (
      <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">FBX 파일을 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-700 overflow-hidden group">
      {/* 사용자 안내 메시지 - 더 작고 세련되게, 호버 시에만 강조 */}
      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white/80 p-2 rounded text-[10px] z-20 pointer-events-none transition-opacity group-hover:bg-black/70">
        <div className="font-semibold mb-1 border-b border-white/20 pb-0.5">💡 조작 안내</div>
        <div>• 회전: 좌클릭 드래그</div>
        <div>• 이동: 우클릭 드래그</div>
        <div>• 확대: 휠 스크롤</div>
      </div>

      {isGenerating && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>썸네일 생성 중...</p>
          </div>
        </div>
      )}

      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        className="w-full h-full"
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
          alpha: false,
          stencil: true,
          depth: true,
        }}
      >
        {/* 썸네일용 배경 - 연한 회색 */}
        <color attach="background" args={["#DEDEDE"]} />

        <Suspense fallback={<LoadingFallback />}>
          {/* 기존 FbxViewer와 동일한 Stage 설정 - 사용자가 조작 가능 */}
          <Stage adjustCamera={1.2} intensity={0} shadows={false}>
            <FbxModel fbxUrl={fbxUrl} />
          </Stage>

          {/* 기존 FbxViewer와 동일한 조명 설정 */}
          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {/* 사용자가 마우스로 조작 가능한 컨트롤 */}
          <OrbitControls
            makeDefault
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            autoRotate={false}
            minDistance={0.5}
            maxDistance={30}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            dampingFactor={0.05}
            enableDamping={true}
          />
        </Suspense>

        <ThumbnailCapture onCapture={handleCapture} />
      </Canvas>
    </div>
  );
});

FbxThumbnailGenerator.displayName = "FbxThumbnailGenerator";

export default FbxThumbnailGenerator;
export type { FbxThumbnailGeneratorRef };
