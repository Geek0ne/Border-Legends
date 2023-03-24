/**
 * 边境传说 - CharacterSelectUI
 */

import { ALL_CHARACTERS, CharacterDef } from "../data/characters/CharacterDefs";

const CLASS_ICONS: Record<string, string> = {
  warrior: "\u2694\ufe0f",
  ranger: "\ud83c\udff9",
  mage: "\ud83d\udd2e",
  priest: "\u2728",
  assassin: "\ud83d\udda5\ufe0f",
};

const STAT_LABELS: Record<string, string> = {
  maxHp: "最大 HP",
  maxMp: "最大 MP",
  attack: "攻击力",
  defense: "防御力",
  speed: "速度",
  magic: "魔法",
};

const STAT_MAX_VALUES: Record<string, number> = {
  maxHp: 150,
  maxMp: 120,
  attack: 28,
  defense: 20,
  speed: 22,
  magic: 28,
};

const STAT_BAR_COLORS: Record<string, [string, string]> = {
  maxHp: ["#e74c3c", "#ff6b6b"],
  maxMp: ["#3498db", "#5dade2"],
  attack: ["#e67e22", "#f39c12"],
  defense: ["#27ae60", "#2ecc71"],
  speed: ["#8e44ad", "#9b59b6"],
  magic: ["#2980b9", "#3498db"],
};

interface CharacterSelectCallbacks {
  onCharacterSelected: (character: CharacterDef) => void;
  onGameStart: (character: CharacterDef) => void;
}

export class CharacterSelectUI {
  private container: HTMLElement;
  private grid: HTMLElement;
  private infoPanel: HTMLElement;
  private startBtn: HTMLButtonElement;
  private selectedCharacter: CharacterDef | null = null;
  private callbacks: CharacterSelectCallbacks;

  constructor(callbacks: CharacterSelectCallbacks) {
    this.callbacks = callbacks;
    this.container = document.getElementById("character-select") as HTMLElement;
    this.grid = document.getElementById("character-grid") as HTMLElement;
    this.infoPanel = document.getElementById("selected-character-info") as HTMLElement;
    this.startBtn = document.getElementById("start-btn") as HTMLButtonElement;
    this.renderCards();
    this.bindEvents();
  }

  private renderCards(): void {
    this.grid.innerHTML = ALL_CHARACTERS.map((char) => {
      const icon = CLASS_ICONS[char.id] || "\ud83d\udc64";
      return "<div class=\"character-card\" data-id=\"" + char.id + "\">"
        + "<span class=\"character-icon\">" + icon + "</span>"
        + "<div class=\"character-name\">" + char.name + "</div>"
        + "<div class=\"character-class\">" + char.className + "</div>"
        + "</div>";
    }).join("");
  }

  private bindEvents(): void {
    this.grid.addEventListener("click", (e) => {
      const card = (e.target as HTMLElement).closest(".character-card") as HTMLElement | null;
      if (!card) return;
      const charId = card.dataset.id;
      const character = ALL_CHARACTERS.find((c) => c.id === charId);
      if (!character) return;
      this.selectCharacter(character);
    });

    this.startBtn.addEventListener("click", () => {
      if (!this.selectedCharacter) return;
      this.callbacks.onGameStart(this.selectedCharacter);
    });
  }

  private renderStatBar(label: string, value: number, maxValue: number, color1: string, color2: string): string {
    const pct = Math.min((value / maxValue) * 100, 100).toFixed(1);
    return "<div class=\"stat-bar-row\">"
      + "<span class=\"stat-label\">" + label + "</span>"
      + "<div class=\"stat-bar\"><div class=\"stat-bar-fill\" style=\"background: linear-gradient(90deg, " + color1 + ", " + color2 + "; width: " + pct + "%;\"></div></div>"
      + "<span class=\"stat-value\">" + value + "</span>"
      + "</div>";
  }

  private selectCharacter(character: CharacterDef): void {
    this.selectedCharacter = character;

    this.grid.querySelectorAll(".character-card").forEach((card) => {
      const el = card as HTMLElement; el.classList.toggle("selected", el.dataset.id === character.id);
    });

    const icon = CLASS_ICONS[character.id] || "\ud83d\udc64";
    const stats = character.stats;

    const statsHtml = ""
      + this.renderStatBar("最大 HP", stats.maxHp, STAT_MAX_VALUES.maxHp, STAT_BAR_COLORS.maxHp[0], STAT_BAR_COLORS.maxHp[1])
      + this.renderStatBar("最大 MP", stats.maxMp, STAT_MAX_VALUES.maxMp, STAT_BAR_COLORS.maxMp[0], STAT_BAR_COLORS.maxMp[1])
      + this.renderStatBar("攻击力", stats.attack, STAT_MAX_VALUES.attack, STAT_BAR_COLORS.attack[0], STAT_BAR_COLORS.attack[1])
      + this.renderStatBar("防御力", stats.defense, STAT_MAX_VALUES.defense, STAT_BAR_COLORS.defense[0], STAT_BAR_COLORS.defense[1])
      + this.renderStatBar("速度", stats.speed, STAT_MAX_VALUES.speed, STAT_BAR_COLORS.speed[0], STAT_BAR_COLORS.speed[1])
      + this.renderStatBar("魔法", stats.magic, STAT_MAX_VALUES.magic, STAT_BAR_COLORS.magic[0], STAT_BAR_COLORS.magic[1]);

    let skillsHtml = character.startingSkills.map((s) => "<span class=\"skill-tag\">" + s + "</span>").join("");

    this.infoPanel.innerHTML =
      "<h3>" + icon + " " + character.name + " &middot; " + character.className + "</h3>"
      + "<p class=\"desc\">" + character.description + "</p>"
      + "<div class=\"stats-bars\">" + statsHtml + "</div>"
      + "<div class=\"skills-list\"><h4>初始技能</h4><div class=\"skill-tags\">" + skillsHtml + "</div></div>";

    this.infoPanel.classList.remove("hidden");
    this.startBtn.disabled = false;
    this.callbacks.onCharacterSelected(character);
  }

  show(): void { this.container.classList.remove("hidden"); }
  hide(): void { this.container.classList.add("hidden"); }
  getSelectedCharacter(): CharacterDef | null { return this.selectedCharacter; }
}
