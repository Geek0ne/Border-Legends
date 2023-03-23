const fs = require("fs");
const path = require("path");
const root = "E:/CodeX_Projects/GameApp";

function fixFile(filePath, replacements) {
  const f = path.join(root, filePath);
  let content = fs.readFileSync(f, "utf8");
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(f, content);
  console.log("Fixed:", filePath);
}

// Fix DamageSystem.ts - template literals lost backticks
fixFile("src/game/combat/DamageSystem.ts", [
  ["floatingText: calc.isCrit ? ${calc.damage}! : ${calc.damage}", "floatingText: `${calc.isCrit ? `${calc.damage}!` : `${calc.damage}`}`"],
  ["floatingText: +,", "floatingText: `+`, "],
  ["console.log(Status applied:  on );", 'console.log(`Status applied: ${status.type} on ${target.name}`);'],
]);

// Fix SkillManager.ts
fixFile("src/game/skills/SkillManager.ts", [
  ['message: \\技能冷却中 (s)\\', "message: `技能冷却中 (${Math.ceil(active.currentCooldown)}s)`"],
  ['message: \\已释放: \\\\', "message: `已释放: ${def.name}`"],
  ['console.log(\[Skill] Status \ applied for \s\\);', "console.log(`[Skill] Status ${effect.value.type} applied for ${characterId}`);"],
  ['console.log(\[Skill] Buff applied for \s\\);', "console.log(`[Skill] Buff applied for ${characterId}`);"],
]);

console.log("All files fixed!");
