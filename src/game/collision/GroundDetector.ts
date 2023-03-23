/**
 * 边境传说 — 地面检测器
 * 检测角色所在位置的碰撞高度
 */

import * as THREE from 'three';

export interface CollisionResult {
  hit: boolean;
  normal: THREE.Vector3;
  distance: number;
}

export class GroundDetector {
  private raycaster: THREE.Raycaster;
  private maxHeight: number = 10;
  private colliders: THREE.Mesh[] = [];

  constructor() {
    this.raycaster = new THREE.Raycaster();
  }

  public setColliders(meshes: THREE.Mesh[]): void {
    this.colliders = meshes;
  }

  public getGroundHeight(position: THREE.Vector3, radius: number = 0.3): number {
    const startY = position.y + this.maxHeight;
    const direction = new THREE.Vector3(0, -1, 0);

    this.raycaster.set(position.clone().add(new THREE.Vector3(0, this.maxHeight, 0)), direction);
    this.raycaster.far = this.maxHeight;

    const intersects = this.raycaster.intersectObjects(this.colliders, false);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }

    return 0;
  }

  public checkWallCollision(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    radius: number = 0.5,
    maxDistance: number = 1
  ): CollisionResult {
    const startPos = position.clone();
    const endPos = position.clone().addScaledVector(direction, maxDistance);

    this.raycaster.set(startPos, endPos.clone().sub(startPos).normalize());
    this.raycaster.far = maxDistance;

    const intersects = this.raycaster.intersectObjects(this.colliders, false);
    if (intersects.length > 0) {
      return {
        hit: true,
        normal: intersects[0].face?.normal.clone() || new THREE.Vector3(0, 1, 0),
        distance: intersects[0].distance,
      };
    }

    return { hit: false, normal: new THREE.Vector3(0, 1, 0), distance: maxDistance };
  }

  public checkCircleCollision(
    pos1: THREE.Vector3, radius1: number,
    pos2: THREE.Vector3, radius2: number
  ): boolean {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz) < radius1 + radius2;
  }
}
