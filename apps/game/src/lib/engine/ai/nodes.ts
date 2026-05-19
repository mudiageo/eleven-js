import { BTNode, type NodeStatus, type AIContext } from "./behavior-tree";

export class HasBallCondition extends BTNode {
  tick(ctx: AIContext): NodeStatus {
    return ctx.hasBall ? "SUCCESS" : "FAILURE";
  }
}

export class TeamHasBallCondition extends BTNode {
  tick(ctx: AIContext): NodeStatus {
    return ctx.teamHasBall ? "SUCCESS" : "FAILURE";
  }
}

export class MoveToBallAction extends BTNode {
  tick(ctx: AIContext): NodeStatus {
    // We handle actual movement out of tree for now, just indicating intent
    return "SUCCESS";
  }
}
