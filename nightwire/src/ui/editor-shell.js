export function bindEditorShell(game) {
  return {
    openSkim: () => game.skim.open(),
    openWardrobe: () => { game.phone.open(); game.phone.showApp('wardrobe'); },
  };
}
