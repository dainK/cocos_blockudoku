import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { Block } from './Block';
import { Board } from './Board';
const { ccclass, property } = _decorator;

@ccclass('Tray')
export class Tray extends Component {

  @property(Prefab)
  blockPrefab!: Prefab;

  @property(Board)
  board: Board;

  @property(Prefab)
  cellPrefab!: Prefab;

  get blocks(): Block[] {
    return this.node.children
        .map(child => child.getComponent(Block))
        .filter(b => b != null) as Block[];
  } 

  start () {
    this.spawn();
    this.board.ui.tray = this;
  }

  spawn () {
    this.node.removeAllChildren();

    for (let i = 2; i > -1; i--) {
        const block = instantiate(this.blockPrefab);
      block.setParent(this.node);
      // block.setPosition(-40 + (i-1) * 250 , 0);

      const b = block.getComponent(Block)!;
      b.tray = this;
      b.board = this.board;
      b.cellPrefab = this.cellPrefab;
      b.initRandom(i-1);
    }
  }

  reset() {
    this.spawn();
  }
}
