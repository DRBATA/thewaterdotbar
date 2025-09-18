"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

interface HydrationSphereProps {
  waterIntake: number
  sodiumIntake: number
  potassiumIntake: number
  waterTarget: number
  sodiumTarget: number
  potassiumTarget: number
}

export function HydrationSphere({
  waterIntake,
  sodiumIntake,
  potassiumIntake,
  waterTarget,
  sodiumTarget,
  potassiumTarget,
}: HydrationSphereProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Calculate progress
    const waterProgress = Math.min(waterIntake / waterTarget, 1)
    const sodiumProgress = Math.min(sodiumIntake / sodiumTarget, 1)
    const potassiumProgress = Math.min(potassiumIntake / potassiumTarget, 1)

    // Wireframe spheres (boundaries)
    const outerWireframe = new THREE.SphereGeometry(5, 32, 32)
    const outerWireframeMesh = new THREE.Mesh(
      outerWireframe,
      new THREE.MeshBasicMaterial({ color: 0x4a90e2, wireframe: true, opacity: 0.3, transparent: true })
    )
    scene.add(outerWireframeMesh)

    const innerWireframe = new THREE.SphereGeometry(2, 32, 32)
    const innerWireframeMesh = new THREE.Mesh(
      innerWireframe,
      new THREE.MeshBasicMaterial({ color: 0xe24a90, wireframe: true, opacity: 0.3, transparent: true })
    )
    scene.add(innerWireframeMesh)

    // Create blob geometry
    function createBlobGeometry(radius: number, detail: number) {
      const geometry = new THREE.IcosahedronGeometry(radius, detail)
      return geometry
    }

    // Inner blob (ICW - potassium driven)
    const innerBlobGeometry = createBlobGeometry(1.8, 3)
    const innerBlobMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.95 + potassiumProgress * 0.05, 0.7, 0.5),
      transparent: true,
      opacity: 0.6 + potassiumProgress * 0.2,
    })
    const innerBlob = new THREE.Mesh(innerBlobGeometry, innerBlobMaterial)
    const innerScale = 0.3 + potassiumProgress * 0.7 // 30% to 100% based on K
    innerBlob.scale.set(innerScale, innerScale, innerScale)
    scene.add(innerBlob)

    // Outer blob (ECW - water/sodium driven)
    const outerBlobGeometry = createBlobGeometry(4.5, 3)
    const combinedProgress = (waterProgress + sodiumProgress) / 2
    const outerBlobMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.55 + combinedProgress * 0.1, 0.6, 0.5),
      transparent: true,
      opacity: 0.3 + combinedProgress * 0.3,
    })
    const outerBlob = new THREE.Mesh(outerBlobGeometry, outerBlobMaterial)
    const outerScale = 0.4 + combinedProgress * 0.6 // 40% to 100% based on water+Na
    outerBlob.scale.set(outerScale, outerScale, outerScale)
    scene.add(outerBlob)

    // Animation
    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate wireframes
      outerWireframeMesh.rotation.y += 0.002
      innerWireframeMesh.rotation.y -= 0.003

      // Undulate blobs
      const time = Date.now() * 0.001
      
      // Inner blob undulation
      const innerPositions = innerBlobGeometry.attributes.position
      for (let i = 0; i < innerPositions.count; i++) {
        const x = innerPositions.getX(i)
        const y = innerPositions.getY(i)
        const z = innerPositions.getZ(i)
        
        const noise = 
          Math.sin(time * 2 + x * 0.5) * 0.1 +
          Math.sin(time * 1.5 + y * 0.7) * 0.08 +
          Math.sin(time * 1.8 + z * 0.6) * 0.06
        
        const scale = 1 + noise * potassiumProgress
        innerPositions.setXYZ(i, x * scale, y * scale, z * scale)
      }
      innerBlobGeometry.attributes.position.needsUpdate = true

      // Outer blob undulation
      const outerPositions = outerBlobGeometry.attributes.position
      for (let i = 0; i < outerPositions.count; i++) {
        const x = outerPositions.getX(i)
        const y = outerPositions.getY(i)
        const z = outerPositions.getZ(i)
        
        const noise = 
          Math.sin(time * 1.5 + x * 0.4) * 0.12 +
          Math.sin(time * 1.2 + y * 0.6) * 0.09 +
          Math.sin(time * 1.7 + z * 0.5) * 0.07
        
        const scale = 1 + noise * combinedProgress
        outerPositions.setXYZ(i, x * scale, y * scale, z * scale)
      }
      outerBlobGeometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [waterIntake, sodiumIntake, potassiumIntake, waterTarget, sodiumTarget, potassiumTarget])

  return <div ref={mountRef} className="w-full h-64" />
}
