import {
    _decorator, Component, Node, UITransform,
    Vec3, instantiate, Sprite, Color,
    Prefab
  } from 'cc';
import { UI } from './UI';
import { Block } from './Block';
  const { ccclass, property } = _decorator;
  
  @ccclass('Board')
  export class Board extends Component {
    @property(UI)
    ui: UI;
  
    @property(Prefab)
    cellPrefab!: Prefab;
  
    size = 8;
    cellSize = 80;
  
    grid:boolean[][] = [];
    cellNodes:Node[][] = [];
    private previewCells: { bx: number; by: number }[] = [];
    combo:number=0;

    start () {
      this.initGrid();
      this.createBoardVisual();
      this.ui.board = this;
    }
  
    initGrid () {
      this.grid = Array.from(
        { length: this.size },
        () => Array(this.size).fill(false)
      );
  
      this.cellNodes = Array.from(
        { length: this.size },
        () => Array(this.size).fill(null)
      );
    }
  
    createBoardVisual () {
      const half = (this.size * this.cellSize) / 2;
  
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
  
          const cell = instantiate(this.cellPrefab);
          cell.setParent(this.node);
  
          cell.setPosition(
            -half + x * this.cellSize + this.cellSize / 2,
            half - y * this.cellSize - this.cellSize / 2
          );
  
          // 기본 보드 색
          const sprite = cell.getComponent(Sprite)!;
          sprite.color = Color.WHITE;
  
          this.cellNodes[y][x] = cell;
        }
      }
  
      const ui = this.node.getComponent(UITransform)!;
      ui.setContentSize(
        this.size * this.cellSize,
        this.size * this.cellSize
      );
    }
  
    worldToGrid (worldPos:Vec3) {
      const local = this.node.getComponent(UITransform)!
        .convertToNodeSpaceAR(worldPos);
  
      const x = Math.floor(
        (local.x + (this.size*this.cellSize)/2) / this.cellSize
      );
      const y = Math.floor(
        ((this.size*this.cellSize)/2 - local.y) / this.cellSize
      );
  
      return { x, y };
    }
  
    canPlace (shape:number[][], gx:number, gy:number) {
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
          if (!shape[y][x]) continue;
  
          const bx = gx + x;
          const by = gy + y;
  
          if (
            bx < 0 || by < 0 ||
            bx >= this.size || by >= this.size ||
            this.grid[by][bx]
          ) {
            return false;
          }
        }
      }
      return true;
    }
  
    // 🔥 여기서 "고정"이 일어난다
    place (shape:number[][], gx:number, gy:number, color:Color) {
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[0].length; x++) {
          if (!shape[y][x]) continue;
  
          const bx = gx + x;
          const by = gy + y;
  
          this.grid[by][bx] = true;
  
          // 보드 셀 색 고정
          const cell = this.cellNodes[by][bx];
          cell.getComponent(Sprite)!.color = color;
        }
      }
      this.checkAndClearLines();
    }

    checkAndClearLines() {
        const fullRows: number[] = [];
        const fullCols: number[] = [];
    
        // 가로 검사
        for (let r = 0; r < this.size; r++) {
            let full = true;
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) {
                    full = false;
                    break;
                }
            }
            if (full) fullRows.push(r);
        }
    
        // 세로 검사
        for (let c = 0; c < this.size; c++) {
            let full = true;
            for (let r = 0; r < this.size; r++) {
                if (!this.grid[r][c]) {
                    full = false;
                    break;
                }
            }
            if (full) fullCols.push(c);
        }
    
        if (fullRows.length || fullCols.length) {
            this.clearLines(fullRows, fullCols);

            const cross = Math.min(fullRows.length,fullCols.length);
            const max = Math.max(fullRows.length,fullCols.length);
            // cross
            const score = fullRows.length * 100 + fullCols.length * 100 + cross * 50;
            this.ui.addScore(score + score * this.combo * 0.5, this.combo,cross,max);
            this.combo++;
        }
        else {
          this.combo = 0;
        }
    }

    clearLines(rows: number[], cols: number[]) {
        // 가로 삭제
        for (const r of rows) {
            for (let c = 0; c < this.size; c++) {
                this.grid[r][c] = false;
                this.clearCell(r, c);
            }
        }
        // 세로 삭제
        for (const c of cols) {
            for (let r = 0; r < this.size; r++) {
                this.grid[r][c] = false;
                this.clearCell(r, c);
            }
        }
    }

    clearCell(r: number, c: number) {
        const cell = this.cellNodes[r][c];
        cell.getComponent(Sprite).color = Color.WHITE;
    }

    clearPreview() {
        for (const p of this.previewCells) {
            const cell = this.cellNodes[p.by][p.bx];
            if(cell)
                cell.getComponent(Sprite).color = Color.WHITE;
        }
        this.previewCells.length = 0;
    }
    preview(shape: number[][], baseRow: number, baseCol: number) {
        this.clearPreview();

        if (!this.canPlace(shape, baseRow, baseCol)) return;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[0].length; x++) {
              if (!shape[y][x]) continue;
      
              const bx = baseRow + x;
              const by = baseCol + y;
                this.previewCells.push({ bx, by });
            }
          }
    
            for (const p of this.previewCells) {
                const cell = this.cellNodes[p.by][p.bx];
                if (cell) {
                    cell.getComponent(Sprite)!.color =
                        new Color(100, 255, 100, 180);
                }
            }
    }
    getCellFromPos(pos: Vec3): { row: number; col: number } | null {
        const size = this.cellSize;
        const startX = -this.size * size / 2;
        const startY = this.size * size / 2;
    
        const col = Math.floor((pos.x - startX) / size);
        const row = Math.floor((startY - pos.y) / size);
    
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
            return null;
        }
        return { row, col };
    }
    
    canPlaceAny(blocks: Block[]): boolean {
      for (const block of blocks) {
          const shape = block.shape;
          if (!shape || shape.length === 0) continue;
  
          const shapeH = shape.length;
          const shapeW = shape[0].length;
  
          // 보드의 모든 좌표에 대해 시도
          for (let y = 0; y <= this.size - shapeH; y++) {
              for (let x = 0; x <= this.size - shapeW; x++) {
                  if (this.canPlace(shape, x, y)) {
                      // console.log('✅ 놓을 수 있음', block.node.name, x, y);
                      return true;
                  }
              }
          }
      }
  
      // console.log('❌ 어떤 블록도 놓을 수 없음');
      return false;
  }

  gameOver() {
    this.ui.onGameOver();
  }

  reset() {
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
            this.grid[r][c] = false;
            this.clearCell(r, c);
        }
    }

    this.combo = 0;
  }

}
  