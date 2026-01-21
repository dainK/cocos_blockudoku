import { _decorator, Button, Color, Component, instantiate, Label, Node, Prefab, Sprite, Tween, UIOpacity, Vec3 } from 'cc';
import { Tray } from './Tray';
import { Board } from './Board';
const { ccclass, property } = _decorator;

@ccclass('UI')
export class UI extends Component {
    tray: Tray;
    board: Board;
    // @property(Label)
    // comboLabel:Label;
    @property(Label)
    scoreLabel:Label;
    @property(Label)
    bestScoreLabel:Label;

    @property(Node)
    gameOver:Node;
    @property(Button)
    replay:Button;

    @property(Prefab)
    combo:Prefab;
    // combos:Node[]=[];

    score:number=0;
    // bestScore:number=0;
    scoreTween:Tween;

    protected start(): void {
        this.replay.node.on(Button.EventType.CLICK, this.onReplay.bind(this));

        this.reset();
    }

    addScore(score:number,combo:number,cross:number,max:number) {
        this.score+=score;

        const duration = Math.abs(Number(this.scoreLabel.string) - this.score) * 0.01;
        const obj = { value: Number(this.scoreLabel.string) };
        this.scoreTween?.stop();
        this.scoreTween = new Tween(obj)
            .to(duration, { value: this.score }, {
                onUpdate: () => {
                    this.scoreLabel.string = Math.floor(obj.value).toString();
                }
            })
            .start();

        if(combo>0) {
            const comboPrefab = instantiate(this.combo);
            this.node.addChild(comboPrefab);
            // comboPrefab.addComponent(UIOpacity);
            const comboScore = score * combo * 0.5;
            const comboLabel = comboPrefab.getChildByName('Win').getComponent(Label);
            comboLabel.string = comboScore.toString();

            const sprite = comboPrefab.addComponent(Sprite);
            new Tween(sprite)
            .to(0.5,{color:new Color(255,255,255,0)})
            .start();

            new Tween(comboPrefab)
            .to(0.6,{
                position: new Vec3(0,50),
                scale:new Vec3(1,1),
                // opacity:100
             })
             .call(()=>{
                comboPrefab.destroy();
             })
             .start();
        }
    }

    onGameOver() {
        this.scoreTween?.stop();
        this.scoreLabel.string = this.score.toString();
        const best = Number(localStorage.getItem('bestScore')) || 0;
        localStorage.setItem('bestScore',Math.max(this.score,best).toString());

        this.gameOver.active = true;
        console.log('over');
    }

    reset() {
        this.scoreLabel.string = '0';

        const best = Number(localStorage.getItem('bestScore')) || 0;
        this.bestScoreLabel.string = best.toString();

        this.gameOver.active = false;
    }

    onReplay() {
        this.reset();
        this.board.reset();
        this.tray.reset();
    }
}

