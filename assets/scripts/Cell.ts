import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('Cell')
export class Cell extends Component {
    occupied = false;
}
