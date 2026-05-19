export type NodeStatus = "SUCCESS" | "FAILURE" | "RUNNING";

export interface AIContext {
  playerId: number;
  teamId: number;
  position: { x: number; y: number; z: number };
  ballPosition: { x: number; y: number; z: number };
  hasBall: boolean;
  teamHasBall: boolean;
}

export abstract class BTNode {
  abstract tick(context: AIContext): NodeStatus;
}

export class SelectorNode extends BTNode {
  constructor(public children: BTNode[]) {
    super();
  }

  tick(ctx: AIContext): NodeStatus {
    for (const child of this.children) {
      const result = child.tick(ctx);
      if (result !== "FAILURE") return result;
    }
    return "FAILURE";
  }
}

export class SequenceNode extends BTNode {
  constructor(public children: BTNode[]) {
    super();
  }

  tick(ctx: AIContext): NodeStatus {
    for (const child of this.children) {
      const result = child.tick(ctx);
      if (result !== "SUCCESS") return result;
    }
    return "SUCCESS";
  }
}
