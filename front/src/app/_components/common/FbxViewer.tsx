"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useFBX } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

interface FbxViewerProps {
  fbxUrl: string;
}

function FbxModel({ fbxUrl }: { fbxUrl: string }) {
  const modelRef = useRef<THREE.Group | null>(null);
  const fbx = useFBX(fbxUrl);

  useEffect(() => {
    if (!fbx) return;
    fbx.scale.setScalar(0.01);
    fbx.rotation.set(-Math.PI / 2, 0, 0);
  }, [fbx]);

  //   // const scale = 0.01; // 뷰포트에 맞게 크기 조정
  //   // fbx.scale.setScalar(scale);
  // }, [fbx]);

  // useEffect(() => {
  //   if (!fbx) return;

  //   // 모델의 바운딩 박스 계산
  //   const box = new THREE.Box3().setFromObject(fbx);
  //   const center = box.getCenter(new THREE.Vector3());

  //   // 모델을 중앙으로 이동
  //   fbx.position.sub(center);

  //   // 회전 설정
  //   fbx.rotation.set(-Math.PI / 2, 0, 0);

  //   // 모델 크기 자동 조정
  //   const size = box.getSize(new THREE.Vector3());
  //   const maxDim = Math.max(size.x, size.y, size.z);
  //   const scale = 1 / maxDim /;
  //   fbx.scale.setScalar(scale);
  // }, [fbx]);

  return <primitive ref={modelRef} object={fbx} />;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#4a90e2" />
    </mesh>
  );
}

export default function FbxViewer({ fbxUrl }: FbxViewerProps) {
  const fullUrl = fbxUrl.startsWith("http")
    ? fbxUrl
    : `${process.env.NEXT_PUBLIC_API_URL}${fbxUrl}`;

  return (
    <div className="w-full h-full">
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
          alpha: true,
          stencil: true,
          depth: true,
        }}
      >
        <color attach="background" args={["#e0e0e0"]} />

        <Suspense fallback={<LoadingFallback />}>
          <Stage adjustCamera={1.2} intensity={0} shadows={false}>
            <FbxModel fbxUrl={fullUrl} />
          </Stage>

          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <OrbitControls
            makeDefault
            autoRotate={true}
            autoRotateSpeed={0.5}
            enableZoom={true}
            enablePan={true}
            minDistance={0.5}
            maxDistance={30}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            dampingFactor={0.05}
            enableDamping={true}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
