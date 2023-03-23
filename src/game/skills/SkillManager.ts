import { skillDB, SkillRecord } from "./SkillDatabase";

export class SkillManager {
  private cooldowns: Map<string, number> = new Map();
  private cooldownTimers: Map<string, number> = new Map();

  useSkill(user: string, skillId: string, target: string, mp: number): { success: boolean; message: string; damage?: number } {
    const skill = skillDB[skillId];
    if (!skill) {
      return { success: false, message: `Unknown skill: ${skillId}` };
    }

    if (mp < skill.mpCost) {
      return { success: false, message: `Not enough MP for ${skill.name}` };
    }

    const currentCooldown = this.cooldowns.get(`${user}:${skill.id}`) || 0;
    if (currentCooldown > 0) {
      return { success: false, message: `${skill.name} is on cooldown (${currentCooldown.toFixed(1)}s)` };
    }

    this.cooldownTimers.set(`${user}:${skill.id}`, skill.cooldown);
    return { success: true, message: `${user} used ${skill.name} on ${target}`, damage: skill.id === "fireball" ? 25 : skill.id === "ice_shard" ? 15 : undefined };
  }

  updateCooldowns(delta: number): void {
    for (const [key, timer] of this.cooldownTimers.entries()) {
      const newTimer = timer - delta;
      if (newTimer <= 0) {
        this.cooldowns.delete(key);
        this.cooldownTimers.delete(key);
      } else {
        this.cooldowns.set(key, newTimer);
      }
    }
  }
}
