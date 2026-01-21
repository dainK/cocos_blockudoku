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
  
    worldToGridTopLeft(worldPos: Vec3) {
      const local = this.node.getComponent(UITransform)!
        .convertToNodeSpaceAR(worldPos);
    
      const startX = -this.size * this.cellSize / 2;
      const startY =  this.size * this.cellSize / 2;
    
      const x = Math.floor((local.x - startX) / this.cellSize);
      const y = Math.floor((startY - local.y) / this.cellSize);
    
      return { x, y };
    }
    canPlace(shape: number[][], gx: number, gy: number): boolean {
      const h = shape.length;
      const w = shape[0].length;
  
      for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
              if (shape[y][x]==0) continue;
  
              const bx = gx + x;
              const by = gy + y;
  
              // 1이 보드 밖이면 놓을 수 없음
              if (bx < 0 || bx >= this.size || by < 0 || by >= this.size) return false;
  
              // 이미 채워진 칸이면 놓을 수 없음
              if (this.grid[by][bx]) return false;
          }
      }
      return true;
  }

    place(shape: number[][], gx: number, gy: number, color: Color) {
      const h = shape.length;
      const w = shape[0].length;
    
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!shape[y][x]) continue;
    
          const bx = gx + x;
          const by = gy + y;
    
          this.grid[by][bx] = true;
          this.cellNodes[by][bx]
            .getComponent(Sprite)!.color = color;
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
    preview(shape: number[][], gx: number, gy: number) {
      this.clearPreview();
  
      // shape 안의 1이 하나라도 보드 밖이면 preview 안 보여줌
      if (!this.canPlace(shape, gx, gy)) return;
  
      const h = shape.length;
      const w = shape[0].length;
  
      for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
              if (!shape[y][x]) continue;
  
              const bx = gx + x;
              const by = gy + y;
  
              this.previewCells.push({ bx, by });
          }
      }
  
      for (const p of this.previewCells) {
          const cell = this.cellNodes[p.by][p.bx];
          if (cell) {
              cell.getComponent(Sprite)!.color = new Color(100, 255, 100, 180);
          }
      }
  }
    

    getShapeCells(shape) {
      const cells = [];
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          if (shape[y][x] === 1) {
            cells.push({ x, y });
          }
        }
      }
      return cells;
    }
    // getShapeSize(shape: number[][]): {rows: number, cols: number} {
    //   let maxRow = 0, maxCol = 0;
    //   for (let y = 0; y < shape.length; y++) {
    //     for (let x = 0; x < shape[0].length; x++) {
    //       if (shape[y][x]) {
    //         maxRow = Math.max(maxRow, y);
    //         maxCol = Math.max(maxCol, x);
    //       }
    //     }
    //   }
    //   return { rows: maxRow + 1, cols: maxCol + 1 };
    // }
    
    canPlaceAny(blocks: Block[]): boolean {
      for (const block of blocks) {
          const shape = block.shape;
          const h = shape.length;
          const w = shape[0].length;
  
          // 보드 전체를 gx: 0~size-1, gy: 0~size-1까지 돌면서 canPlace 확인
          for (let gy = -h+1; gy < this.size; gy++) {
              for (let gx = -w+1; gx < this.size; gx++) {
                  if (this.canPlace(shape, gx, gy)) {
                      console.log('can');
                      return true; // 하나라도 놓을 수 있음
                  }
              }
          }
      }
      console.log('nocan');
      return false; // 모든 블록 놓을 수 없음 → 게임오버
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
  