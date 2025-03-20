import { KeyboardControlsEntry } from "@react-three/drei";

export const keyboardMap: KeyboardControlsEntry[] = [
  { name: "up", keys: ["ArrowUp", "w", "W", "ㅈ", "ㅉ"] },
  { name: "down", keys: ["ArrowDown", "s", "S", "ㄴ"] },
  { name: "left", keys: ["ArrowLeft", "a", "A", "ㅁ"] },
  { name: "right", keys: ["ArrowRight", "d", "D", "ㅇ"] },
  { name: "jump", keys: ["Space"] },
  { name: "run", keys: ["Shift"] },
  { name: "action1", keys: ["1", "z", "Z"] }, // 펀치
  { name: "action2", keys: ["2", "x", "X"] }, // 히트
  { name: "action3", keys: ["3", "c", "C"] }, // 죽기
];
