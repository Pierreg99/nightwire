export class Prompt {
  constructor(game) {
    this.game = game;
    this.el = document.getElementById('interact-prompt');
    this.current = null;
  }
  update() {
    if (this.game.mode !== 'play' || this.game.player.inVehicle) {
      this.el.classList.add('hidden');
      this.current = null;
      return;
    }
    const it = this.game.world.nearestInteract(this.game.player.pos, 2.15);
    this.current = it;
    if (!it) { this.el.classList.add('hidden'); return; }
    this.el.classList.remove('hidden');
    this.el.textContent = it.label;
  }
}
