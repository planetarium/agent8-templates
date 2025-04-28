import { Vector3 } from '@react-three/fiber';

export const AircraftState: { [key: string]: string } = {
  ACTIVE: 'ACTIVE',
  DIE: 'DIE',
};

export type AircraftState = (typeof AircraftState)[keyof typeof AircraftState];

export const DEFAULT_BODY_LENGTH = 3;
export const HIT_BODY_SIZE: Vector3 = [1, 0.6, 3];
