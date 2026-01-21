import {
    _decorator, Component, Node, UITransform,
    Vec3, EventTouch, Color, Sprite,
    instantiate,
    Prefab
  } from 'cc';
  import { SHAPES } from './Shapes';
import { Tray } from './Tray';
import { Board } from './Board';
  const { ccclass, property } = _decorator;
  
  @ccclass('Block')
  export class Block extends Component {
    tray: Tray;
    board: Board;
    cellPrefab: Prefab;
  
    shape:number[][] = [];
    cells:Node[] = [];
    color:Color = Color.WHITE;
  
    startPos = new Vec3();
  
    start () {
      this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
      this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
      this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
      this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
  
    initRandom (pos:number) {
      this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  
      const COLORS = [
        new Color(255, 99, 71),
        new Color(100, 149, 237),
        new Color(60, 179, 113),
        new Color(238, 130, 238),
        new Color(255, 215, 0),
      ];
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  
      this.build(pos);
      this.node.setScale(0.6, 0.6, 1);
    }
  
    build (pos:number) {
      this.node.removeAllChildren();
      this.cells.length = 0;
  
      const size = 80;
      const rows = this.shape.length;
      const cols = this.shape[0].length;
  
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (this.shape[y][x] === 0) continue;
  
          const cell = instantiate(this.cellPrefab);
          cell.setParent(this.node);
          cell.setPosition(
            x * size,
            -y * size
          );
  
          cell.getComponent(Sprite)!.color = this.color;
          this.cells.push(cell);
        }
      }

      this.node.setPosition(250*pos + (1-cols)*size/2,0)

      const ui = this.node.getComponent(UITransform)!;
      ui.setContentSize((cols+1) * size, (rows+3) * size);
    }
  
    onTouchStart () {
      this.startPos.set(this.node.position);
      this.node.setScale(1, 1, 1);
    }
  
    onTouchMove (e:EventTouch) {
      const delta = e.getUIDelta();
      this.node.setPosition(
        this.node.position.x + delta.x,
        this.node.position.y + delta.y
      );

        const worldPos = this.node.worldPosition.clone();
        const { x, y } = this.board.worldToGrid(worldPos);
        this.board.preview(this.shape, x, y);
    }


    onTouchEnd () {
        this.node.setScale(0.6,0.6,1);
      
        const worldPos = this.node.worldPosition.clone();
        const { x, y } = this.board.worldToGrid(worldPos);

        const boardPos = this.board.node.getComponent(UITransform)
            .convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y));

        const cell = this.board.getCellFromPos(boardPos);
        this.board.clearPreview();
      
        if (cell && this.board.canPlace(this.shape, x, y)) {
            this.board.place(this.shape, x, y, this.color);
            this.onDropSuccess();
        } else {
          this.node.setPosition(this.startPos); // ❌ 실패 → 복귀
        }
      }

      onDropSuccess() {
        this.node.destroy();
    
        // 트레이가 비었는지 확인
        if (this.tray.node.children.length-1== 0) {
            this.tray.spawn();
        }
      // 🔥 여기서 게임오버 체크
      const canPlace = this.board.canPlaceAny(this.tray.blocks);
      if (!canPlace) {
          // canPlaceAny 안에서 onGameOver 호출 안 해도 됨
          this.board.gameOver();
      }
    }
  }
  