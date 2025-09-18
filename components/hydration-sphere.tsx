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

    // Inner blob (ICW - potassium driven)
    const innerBlobGeometry = new THREE.IcosahedronGeometry(1.8, 20)
    const innerBlobMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.95, 0.7, 0.5),
      transparent: true,
      opacity: 0.6 + potassiumProgress * 0.3,
    })
    const innerBlob = new THREE.Mesh(innerBlobGeometry, innerBlobMaterial)
    const innerScale = 0.3 + potassiumProgress * 0.7
    innerBlob.scale.set(innerScale, innerScale, innerScale)
    scene.add(innerBlob)

    // Outer blob (ECW - water/sodium driven)
    const outerBlobGeometry = new THREE.IcosahedronGeometry(4.5, 24)
    const combinedProgress = (waterProgress + sodiumProgress) / 2
    const outerBlobMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(0.55, 0.6, 0.5),
      transparent: true,
      opacity: 0.3 + combinedProgress * 0.3,
    })
    const outerBlob = new THREE.Mesh(outerBlobGeometry, outerBlobMaterial)
    const outerScale = 0.4 + combinedProgress * 0.6
    outerBlob.scale.set(outerScale, outerScale, outerScale)
    scene.add(outerBlob)

    // Store initial positions for animation
    const innerPositions = innerBlobGeometry.attributes.position
    const innerArray = new Float32Array(innerPositions.array)
    
    const outerPositions = outerBlobGeometry.attributes.position  
    const outerArray = new Float32Array(outerPositions.array)

    // Animation
    let time = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.01

      // Rotate wireframes
      outerWireframeMesh.rotation.y += 0.002
      innerWireframeMesh.rotation.y -= 0.003

      // Rotate blobs slowly
      innerBlob.rotation.x = time * 0.1
      innerBlob.rotation.y = time * 0.15
      outerBlob.rotation.x = -time * 0.08
      outerBlob.rotation.y = time * 0.12
      
      // Undulate inner blob
      for (let i = 0; i < innerPositions.count; i++) {
        const x = innerArray[i * 3]
        const y = innerArray[i * 3 + 1]
        const z = innerArray[i * 3 + 2]
        
        const noise = 
          Math.sin(time * 2 + x * 0.5) * 0.1 +
          Math.sin(time * 1.5 + y * 0.7) * 0.08 +
          Math.sin(time * 1.8 + z * 0.6) * 0.06
        
        const scale = 1 + noise * potassiumProgress * 0.15
        innerPositions.setXYZ(i, x * scale, y * scale, z * scale)
      }
      innerBlobGeometry.attributes.position.needsUpdate = true

      // Undulate outer blob
      for (let i = 0; i < outerPositions.count; i++) {
        const x = outerArray[i * 3]
        const y = outerArray[i * 3 + 1]
        const z = outerArray[i * 3 + 2]
        
        const noise = 
          Math.sin(time * 1.5 + x * 0.4) * 0.12 +
          Math.sin(time * 1.2 + y * 0.6) * 0.09 +
          Math.sin(time * 1.7 + z * 0.5) * 0.07
        
        const scale = 1 + noise * combinedProgress * 0.15
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
