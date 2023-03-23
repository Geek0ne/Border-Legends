const fs = require("fs");
const BT = String.fromCharCode(96);
const f = "E:/CodeX_Projects/GameApp/src/game/skills/SkillManager.ts";
let c = fs.readFileSync(f, "utf8");

// Fix the two remaining lines with literal backslash chars
c = c.replace(
  "console.log(\\[Skill] Status \\ applied for \\s\\);",
  "console.log(" + BT + "[Skill] Status ${effect.value.type} applied for ${characterId}" + BT + ");"
);
c = c.replace(
  "console.log(\\[Skill] Buff applied for \\s\\);",
  "console.log(" + BT + "[Skill] Buff applied for ${characterId}" + BT + ");"
);

fs.writeFileSync(f, c);
console.log("SkillManager.ts fixed");
