import { SkillDef, SkillCategory } from '../../types/combat';

export class SkillManager {
  private skills: Map<string, SkillDef> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private skillLevels: Map<string, number> = new Map();
  private onSkillLearned?: (skillId: string) => void;
  private onCooldownUpdate?: (skillId: string, remaining: number) => void;

  registerSkill(skill: SkillDef): void {
    this.skills.set(skill.id, skill);
    this.skillLevels.set(skill.id, 1);
  }

  batchRegisterSkills(skills: SkillDef[]): void {
    for (const skill of skills) this.registerSkill(skill);
  }

  learnSkill(skillId: string, level: number = 1): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    this.skillLevels.set(skillId, level);
    this.onSkillLearned?.(skillId);
    return true;
  }

  getSkill(skillId: string): SkillDef | undefined {
    const skill = this.skills.get(skillId);
    if (!skill) return undefined;
    const level = this.skillLevels.get(skillId) ?? 1;
    return this.scaleSkillByLevel(skill, level);
  }

  getSkillsByCategory(category: SkillCategory): SkillDef[] {
    return Array.from(this.skills.values())
      .filter((s) => s.category === category)
      .map((s) => this.scaleSkillByLevel(s, this.skillLevels.get(s.id) ?? 1));
  }

  canUseSkill(skillId: string, resourceValue: number, resourceMax: number): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    if (this.isOnCooldown(skillId)) return false;
    return resourceValue >= skill.cost;
  }

  useSkill(skillId: string, resourceValue: number, resourceMax: number): number | null {
    const skill = this.skills.get(skillId);
    if (!skill) return null;
    if (!this.canUseSkill(skillId, resourceValue, resourceMax)) return null;
    this.startCooldown(skillId, skill.cooldown ?? 1);
    return skill.cost;
  }

  startCooldown(skillId: string, cooldownSeconds: number): void {
    this.cooldowns.set(skillId, cooldownSeconds);
    this.tickCooldowns(0);
    const skill = this.skills.get(skillId);
    this.onCooldownUpdate?.(skillId, cooldownSeconds);
  }

  tickCooldowns(dt: number): void {
    const updated = new Set<string>();
    for (const [skillId, remaining] of this.cooldowns.entries()) {
      const newRemaining = Math.max(0, remaining - dt);
      if (newRemaining <= 0) {
        this.cooldowns.delete(skillId);
        updated.add(skillId);
      } else {
        this.cooldowns.set(skillId, newRemaining);
        updated.add(skillId);
      }
    }
    for (const skillId of updated) {
      this.onCooldownUpdate?.(skillId, this.cooldowns.get(skillId) ?? 0);
    }
  }

  isOnCooldown(skillId: string): boolean {
    return this.cooldowns.has(skillId);
  }

  getCooldownRemaining(skillId: string): number {
    return this.cooldowns.get(skillId) ?? 0;
  }

  setOnSkillLearned(cb: (skillId: string) => void): void {
    this.onSkillLearned = cb;
  }

  setOnCooldownUpdate(cb: (skillId: string, remaining: number) => void): void {
    this.onCooldownUpdate = cb;
  }

  getSkillLevel(skillId: string): number {
    return this.skillLevels.get(skillId) ?? 0;
  }

  getAvailableSkills(): SkillDef[] {
    return Array.from(this.skills.values()).map((s) =>
      this.scaleSkillByLevel(s, this.skillLevels.get(s.id) ?? 1)
    );
  }

  private scaleSkillByLevel(skill: SkillDef, level: number): SkillDef {
    if (level <= 1) return skill;
    const scale = 1 + (level - 1) * 0.1;
    return {
      ...skill,
      damage: {
        ...skill.damage,
        base: Math.floor(skill.damage.base * scale),
        scaling: skill.damage.scaling * scale,
      },
      cost: Math.ceil(skill.cost * (1 + (level - 1) * 0.05)),
    };
  }
}
